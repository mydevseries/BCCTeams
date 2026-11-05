import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@bccteams.local',
    displayName: 'Test User',
    isActive: true,
  };

  const mockSettings = {
    userId: 'user-uuid-1',
    theme: 'light',
    language: 'en',
    notifyBanners: true,
    notifySounds: true,
    notifyEmailDigest: true,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    workLocation: 'Office',
    readReceipts: true,
    chatDensity: 'comfortable',
    enterToSend: true,
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('returns existing settings for active user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userSettings.findUnique.mockResolvedValue(mockSettings);

      const result = await service.getSettings('user-uuid-1');
      expect(result.theme).toBe('light');
      expect(result.language).toBe('en');
      expect(result.notifyBanners).toBe(true);
    });

    it('creates default settings if none exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userSettings.findUnique.mockResolvedValue(null);
      mockPrismaService.userSettings.create.mockResolvedValue(mockSettings);

      const result = await service.getSettings('user-uuid-1');
      expect(mockPrismaService.userSettings.create).toHaveBeenCalled();
      expect(result.theme).toBe('light');
    });

    it('throws NotFoundException if user is inactive or not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getSettings('unknown-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    it('updates user settings and persists new preferences', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userSettings.upsert.mockResolvedValue({
        ...mockSettings,
        theme: 'dark',
        language: 'fr',
        notifySounds: false,
      });

      const result = await service.updateSettings('user-uuid-1', {
        theme: 'dark',
        language: 'fr',
        notifySounds: false,
      });

      expect(result.theme).toBe('dark');
      expect(result.language).toBe('fr');
      expect(result.notifySounds).toBe(false);
      expect(mockPrismaService.userSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-uuid-1' },
        })
      );
    });
  });
});

