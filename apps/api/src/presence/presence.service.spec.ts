import { Test, TestingModule } from '@nestjs/testing';
import { PresenceService } from './presence.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { PresenceStatus } from '@prisma/client';

describe('PresenceService', () => {
  let service: PresenceService;

  const mockPrisma = {
    presence: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockGateway = {
    emitToRoom: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresenceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  describe('Connection Tracking & 30-Second Grace Period', () => {
    it('registers user connection and restores status if previously OFFLINE with savedStatus', async () => {
      mockPrisma.presence.findUnique.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.OFFLINE,
        savedStatus: PresenceStatus.BUSY,
        isManual: false,
        lastActiveAt: new Date(),
      });
      mockPrisma.presence.update.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.BUSY,
        savedStatus: null,
        isManual: false,
        lastActiveAt: new Date(),
      });

      const state = await service.handleConnect('user-1', 'socket-1');

      expect(service.getUserConnectionCount('user-1')).toBe(1);
      expect(mockPrisma.presence.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ status: PresenceStatus.BUSY, savedStatus: null }),
      });
      expect(mockGateway.emitToRoom).toHaveBeenCalledWith(
        'presence:user-1',
        'presence:changed',
        expect.objectContaining({ status: PresenceStatus.BUSY }),
      );
      expect(state.status).toBe(PresenceStatus.BUSY);
    });

    it('schedules 30-second grace timer when last socket disconnects', async () => {
      mockPrisma.presence.findUnique.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.AVAILABLE,
        isManual: false,
        lastActiveAt: new Date(),
      });

      await service.handleConnect('user-1', 'socket-1');
      expect(service.getUserConnectionCount('user-1')).toBe(1);

      service.handleDisconnect('socket-1');
      expect(service.getUserConnectionCount('user-1')).toBe(0);
      expect(service.hasDisconnectTimer('user-1')).toBe(true);

      // Fast-forward 29 seconds - user should still NOT be offline
      jest.advanceTimersByTime(29000);
      expect(mockPrisma.presence.update).not.toHaveBeenCalled();

      // Fast-forward remaining 1 second - 30s elapsed, marks OFFLINE
      mockPrisma.presence.findUnique.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.AVAILABLE,
        isManual: false,
      });
      mockPrisma.presence.update.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.OFFLINE,
        savedStatus: PresenceStatus.AVAILABLE,
        lastActiveAt: new Date(),
      });

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockPrisma.presence.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          status: PresenceStatus.OFFLINE,
          savedStatus: PresenceStatus.AVAILABLE,
        }),
      });
      expect(mockGateway.emitToRoom).toHaveBeenCalledWith(
        'presence:user-1',
        'presence:changed',
        expect.objectContaining({ status: PresenceStatus.OFFLINE }),
      );
    });

    it('cancels disconnect timer if user reconnects within 30-second grace period', async () => {
      mockPrisma.presence.findUnique.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.AVAILABLE,
        isManual: false,
        lastActiveAt: new Date(),
      });

      await service.handleConnect('user-1', 'socket-1');
      service.handleDisconnect('socket-1');
      expect(service.hasDisconnectTimer('user-1')).toBe(true);

      // Reconnect within 10 seconds
      jest.advanceTimersByTime(10000);
      await service.handleConnect('user-1', 'socket-2');

      expect(service.hasDisconnectTimer('user-1')).toBe(false);

      // Advance remaining time - should NOT set offline
      jest.advanceTimersByTime(25000);
      expect(mockPrisma.presence.update).not.toHaveBeenCalled();
    });
  });

  describe('Inactivity & Multi-Tab Rules', () => {
    it('transitions to auto-Away only when ALL connections/tabs are idle for 5 minutes', async () => {
      mockPrisma.presence.findUnique.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.AVAILABLE,
        isManual: false,
        lastActiveAt: new Date(),
      });

      // Connect two tabs
      await service.handleConnect('user-1', 'socket-tab-1');
      await service.handleConnect('user-1', 'socket-tab-2');

      // Tab 1 becomes idle 5 minutes ago, but Tab 2 was active 1 minute ago
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now + 5 * 60 * 1000 + 100);

      // Tab 2 sends heartbeat
      await service.handleHeartbeat('user-1', 'socket-tab-2');

      await service.checkInactivity();
      // Tab 2 is active, so should NOT transition to away
      expect(mockPrisma.presence.update).not.toHaveBeenCalled();

      // Now both tabs idle for > 5 minutes
      jest.spyOn(Date, 'now').mockReturnValue(now + 11 * 60 * 1000);
      mockPrisma.presence.update.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.AWAY,
        isManual: false,
        lastActiveAt: new Date(),
      });

      await service.checkInactivity();
      expect(mockPrisma.presence.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          status: PresenceStatus.AWAY,
          isManual: false,
        }),
      });
    });

    it('does NOT trigger auto-Away if user manually set their status (e.g. manual BUSY or manual AWAY)', async () => {
      mockPrisma.presence.findUnique.mockResolvedValue({
        userId: 'user-1',
        status: PresenceStatus.BUSY,
        isManual: true, // Manual
        lastActiveAt: new Date(),
      });

      await service.handleConnect('user-1', 'socket-1');

      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now + 10 * 60 * 1000);

      await service.checkInactivity();
      expect(mockPrisma.presence.update).not.toHaveBeenCalled();
    });

    it('heartbeat restores AVAILABLE if user was automatically AWAY, but never if manual', async () => {
      // 1. Auto-away
      mockPrisma.presence.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        status: PresenceStatus.AWAY,
        isManual: false,
      });
      mockPrisma.presence.update.mockResolvedValueOnce({
        userId: 'user-1',
        status: PresenceStatus.AVAILABLE,
        isManual: false,
        lastActiveAt: new Date(),
      });

      await service.handleHeartbeat('user-1', 'socket-1');
      expect(mockPrisma.presence.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ status: PresenceStatus.AVAILABLE }),
      });

      // 2. Manual DND
      jest.clearAllMocks();
      mockPrisma.presence.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        status: PresenceStatus.DO_NOT_DISTURB,
        isManual: true,
      });

      await service.handleHeartbeat('user-1', 'socket-1');
      expect(mockPrisma.presence.update).not.toHaveBeenCalled();
    });
  });

  describe('Status Message Expiry Cleanup', () => {
    it('clears expired custom status messages and broadcasts update', async () => {
      const past = new Date(Date.now() - 10000);
      mockPrisma.presence.findMany.mockResolvedValue([
        {
          userId: 'user-exp',
          status: PresenceStatus.AVAILABLE,
          statusMessage: 'In a meeting',
          statusExpiresAt: past,
        },
      ]);
      mockPrisma.presence.update.mockResolvedValue({
        userId: 'user-exp',
        status: PresenceStatus.AVAILABLE,
        statusMessage: null,
        statusExpiresAt: null,
      });

      await service.checkExpiredStatusMessages();

      expect(mockPrisma.presence.update).toHaveBeenCalledWith({
        where: { userId: 'user-exp' },
        data: { statusMessage: null, statusExpiresAt: null },
      });
      expect(mockGateway.emitToRoom).toHaveBeenCalledWith(
        'presence:user-exp',
        'presence:changed',
        expect.objectContaining({ statusMessage: null, statusExpiresAt: null }),
      );
    });
  });

  describe('isDnd Helper', () => {
    it('returns true when user is DO_NOT_DISTURB', async () => {
      mockPrisma.presence.findUnique.mockResolvedValue({
        status: PresenceStatus.DO_NOT_DISTURB,
      });

      const result = await service.isDnd('user-dnd');
      expect(result).toBe(true);
    });

    it('returns false when user is AVAILABLE or other status', async () => {
      mockPrisma.presence.findUnique.mockResolvedValue({
        status: PresenceStatus.AVAILABLE,
      });

      const result = await service.isDnd('user-avail');
      expect(result).toBe(false);
    });
  });
});

