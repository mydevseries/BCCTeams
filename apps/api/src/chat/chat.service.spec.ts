import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { PresenceService } from '../presence/presence.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ChatService (C-001)', () => {
  let service: ChatService;
  let prisma: any;
  let eventsGateway: any;
  let presenceService: any;

  const mockUser1 = {
    id: 'user-1',
    email: 'user1@bcc.test',
    displayName: 'Alice User',
    avatarUrl: null,
    jobTitle: 'Engineer',
    department: 'Engineering',
    role: 'MEMBER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser2 = {
    id: 'user-2',
    email: 'user2@bcc.test',
    displayName: 'Bob Colleague',
    avatarUrl: null,
    jobTitle: 'Designer',
    department: 'Design',
    role: 'MEMBER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      conversation: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      conversationParticipant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      message: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    eventsGateway = {
      emitToRoom: jest.fn(),
    };

    presenceService = {
      getPresence: jest.fn().mockResolvedValue({
        userId: 'user-2',
        status: 'AVAILABLE',
        statusMessage: null,
        statusExpiresAt: null,
        lastActiveAt: new Date(),
      }),
      getBatchPresence: jest.fn().mockResolvedValue({
        'user-1': { userId: 'user-1', status: 'AVAILABLE', lastActiveAt: new Date() },
        'user-2': { userId: 'user-2', status: 'BUSY', lastActiveAt: new Date() },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsGateway, useValue: eventsGateway },
        { provide: PresenceService, useValue: presenceService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('getDirectConversation', () => {
    it('throws BadRequestException if recipientId is current user id', async () => {
      await expect(service.getDirectConversation('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if recipient user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getDirectConversation('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns exists: false and recipient details if no conversation exists yet', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser2);
      prisma.conversation.findFirst.mockResolvedValue(null);

      const result = await service.getDirectConversation('user-1', 'user-2');
      expect(result.exists).toBe(false);
      expect(result.recipient.id).toBe('user-2');
      expect(result.recipient.displayName).toBe('Bob Colleague');
      expect(result.conversation).toBeNull();
      expect(result.messages).toEqual([]);
    });

    it('returns exists: true and messages when conversation exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser2);
      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-123',
        type: 'DIRECT',
        title: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          { id: 'p-1', conversationId: 'conv-123', userId: 'user-1', role: 'MEMBER', user: mockUser1 },
          { id: 'p-2', conversationId: 'conv-123', userId: 'user-2', role: 'MEMBER', user: mockUser2 },
        ],
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-123',
            senderId: 'user-1',
            content: 'Hello Bob!',
            createdAt: new Date(),
            updatedAt: new Date(),
            sender: mockUser1,
          },
        ],
      });

      const result = await service.getDirectConversation('user-1', 'user-2');
      expect(result.exists).toBe(true);
      expect(result.conversation).toBeDefined();
      expect(result.conversation?.id).toBe('conv-123');
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].content).toBe('Hello Bob!');
    });
  });

  describe('createOrGetDirectConversation', () => {
    it('creates a new 1:1 conversation and dispatches initial message', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser2);
      prisma.conversation.findFirst.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue({
        id: 'new-conv',
        type: 'DIRECT',
        participants: [
          { id: 'p1', userId: 'user-1' },
          { id: 'p2', userId: 'user-2' },
        ],
      });
      prisma.message.create.mockResolvedValue({
        id: 'm-1',
        conversationId: 'new-conv',
        senderId: 'user-1',
        content: 'Hey there',
        sender: mockUser1,
      });
      prisma.conversation.update.mockResolvedValue({});
      prisma.conversationParticipant.findMany.mockResolvedValue([
        {
          id: 'p1',
          conversationId: 'new-conv',
          userId: 'user-1',
          role: 'MEMBER',
          conversation: {
            id: 'new-conv',
            type: 'DIRECT',
            participants: [
              { id: 'p1', conversationId: 'new-conv', userId: 'user-1', role: 'MEMBER', user: mockUser1 },
              { id: 'p2', conversationId: 'new-conv', userId: 'user-2', role: 'MEMBER', user: mockUser2 },
            ],
            messages: [{ id: 'm-1', conversationId: 'new-conv', senderId: 'user-1', content: 'Hey there', sender: mockUser1 }],
          },
        },
      ]);

      const result = await service.createOrGetDirectConversation('user-1', 'user-2', 'Hey there');
      expect(result.conversation).toBeDefined();
      expect(result.conversation.id).toBe('new-conv');
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('chat:new-conv', 'chat:message', expect.anything());
    });
  });

  describe('sendMessage', () => {
    it('throws BadRequestException on empty message string', async () => {
      await expect(service.sendMessage('conv-1', 'user-1', '   ')).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException if user is not a participant', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);
      await expect(service.sendMessage('conv-1', 'intruder', 'Hi')).rejects.toThrow(ForbiddenException);
    });

    it('persists message and emits to room if user is participant', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.message.create.mockResolvedValue({
        id: 'msg-99',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Test content',
        sender: mockUser1,
      });
      prisma.conversation.update.mockResolvedValue({});
      prisma.conversationParticipant.update.mockResolvedValue({});
      prisma.conversationParticipant.findMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);

      const msg = await service.sendMessage('conv-1', 'user-1', 'Test content');
      expect(msg.content).toBe('Test content');
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('chat:conv-1', 'chat:message', msg);
    });
  });
});
