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
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      conversationParticipant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      message: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      messageReaction: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
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

  describe('C-002: Group Chat', () => {
    const mockUser3 = {
      id: 'user-3',
      email: 'user3@bcc.test',
      displayName: 'Charlie Colleague',
      avatarUrl: null,
      jobTitle: 'Product Manager',
      department: 'Product',
      role: 'MEMBER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('creates a group conversation with multiple recipients', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser2, mockUser3]);
      prisma.conversation.create.mockResolvedValue({
        id: 'group-1',
        type: 'GROUP',
        title: 'Project Alpha',
      });
      prisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversation: {
            id: 'group-1',
            type: 'GROUP',
            title: 'Project Alpha',
            createdAt: new Date(),
            updatedAt: new Date(),
            participants: [
              { id: 'p1', conversationId: 'group-1', userId: 'user-1', role: 'ADMIN', user: mockUser1 },
              { id: 'p2', conversationId: 'group-1', userId: 'user-2', role: 'MEMBER', user: mockUser2 },
              { id: 'p3', conversationId: 'group-1', userId: 'user-3', role: 'MEMBER', user: mockUser3 },
            ],
            messages: [],
          },
        },
      ]);

      const result = await service.createGroupConversation('user-1', {
        recipientIds: ['user-2', 'user-3'],
        title: 'Project Alpha',
      });

      expect(result.conversation.id).toBe('group-1');
      expect(result.conversation.type).toBe('GROUP');
      expect(result.conversation.title).toBe('Project Alpha');
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('user:user-2', 'chat:conversation_updated', expect.anything());
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('user:user-3', 'chat:conversation_updated', expect.anything());
    });

    it('throws BadRequestException if recipient list is empty', async () => {
      await expect(
        service.createGroupConversation('user-1', { recipientIds: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates group conversation title and creates a system message', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        id: 'p1',
        conversationId: 'group-1',
        userId: 'user-1',
        user: mockUser1,
      });
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'group-1',
        title: 'Old Title',
      });
      prisma.conversation.update.mockResolvedValue({
        id: 'group-1',
        title: 'New Title',
      });
      prisma.message.create.mockResolvedValue({
        id: 'sys-msg-1',
        conversationId: 'group-1',
        senderId: 'user-1',
        content: 'Alice User named the group "New Title"',
        isSystem: true,
        systemAction: 'TITLE_CHANGED',
      });
      prisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversation: {
            id: 'group-1',
            type: 'GROUP',
            title: 'New Title',
            createdAt: new Date(),
            updatedAt: new Date(),
            participants: [
              { id: 'p1', conversationId: 'group-1', userId: 'user-1', role: 'ADMIN', user: mockUser1 },
            ],
            messages: [],
          },
          userId: 'user-1',
        },
      ]);

      const res = await service.updateConversationTitle('group-1', 'user-1', 'New Title');
      expect(res.title).toBe('New Title');
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('chat:group-1', 'chat:message', expect.anything());
    });

    it('adds a participant with history sharing options and emits system message', async () => {
      prisma.conversationParticipant.findUnique
        .mockResolvedValueOnce({ id: 'p1', conversationId: 'group-1', userId: 'user-1', user: mockUser1 }) // actor
        .mockResolvedValueOnce(null); // target does not exist yet
      prisma.conversationParticipant.count.mockResolvedValue(2);
      prisma.user.findUnique.mockResolvedValue(mockUser3);
      prisma.conversationParticipant.create.mockResolvedValue({
        id: 'p3',
        conversationId: 'group-1',
        userId: 'user-3',
      });
      prisma.message.create.mockResolvedValue({
        id: 'sys-msg-2',
        conversationId: 'group-1',
        senderId: 'user-1',
        content: 'Alice User added Charlie Colleague to the chat',
        isSystem: true,
        systemAction: 'MEMBER_ADDED',
      });
      prisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversation: {
            id: 'group-1',
            type: 'GROUP',
            title: 'Project Alpha',
            createdAt: new Date(),
            updatedAt: new Date(),
            participants: [
              { id: 'p1', conversationId: 'group-1', userId: 'user-1', role: 'ADMIN', user: mockUser1 },
              { id: 'p2', conversationId: 'group-1', userId: 'user-2', role: 'MEMBER', user: mockUser2 },
              { id: 'p3', conversationId: 'group-1', userId: 'user-3', role: 'MEMBER', user: mockUser3 },
            ],
            messages: [],
          },
          userId: 'user-1',
        },
      ]);

      const res = await service.addParticipant('group-1', 'user-1', {
        userId: 'user-3',
        historyOption: 'days',
        historyDays: 7,
      });

      expect(res.message.isSystem).toBe(true);
      expect(res.message.systemAction).toBe('MEMBER_ADDED');
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('chat:group-1', 'chat:message', expect.anything());
    });

    it('allows a participant to leave voluntarily with a departure system message', async () => {
      prisma.conversationParticipant.findUnique
        .mockResolvedValueOnce({ id: 'p2', conversationId: 'group-1', userId: 'user-2', user: mockUser2 }) // actor
        .mockResolvedValueOnce({ id: 'p2', conversationId: 'group-1', userId: 'user-2', user: mockUser2 }); // target
      prisma.conversationParticipant.delete.mockResolvedValue({});
      prisma.message.create.mockResolvedValue({
        id: 'sys-msg-3',
        conversationId: 'group-1',
        senderId: 'user-2',
        content: 'Bob Colleague left the chat',
        isSystem: true,
        systemAction: 'MEMBER_LEFT',
      });
      prisma.conversationParticipant.findMany
        .mockResolvedValueOnce([{ userId: 'user-1' }]) // remaining participants
        .mockResolvedValueOnce([
          {
            conversation: {
              id: 'group-1',
              type: 'GROUP',
              title: 'Project Alpha',
              participants: [{ id: 'p1', userId: 'user-1', role: 'ADMIN', user: mockUser1 }],
              messages: [],
            },
            userId: 'user-1',
          },
        ]);

      const res = await service.removeParticipant('group-1', 'user-2', 'user-2');
      expect(res.success).toBe(true);
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('user:user-2', 'chat:participant_removed', expect.anything());
    });

    it('allows removing another member with a removal system message', async () => {
      prisma.conversationParticipant.findUnique
        .mockResolvedValueOnce({ id: 'p1', conversationId: 'group-1', userId: 'user-1', user: mockUser1 }) // actor
        .mockResolvedValueOnce({ id: 'p2', conversationId: 'group-1', userId: 'user-2', user: mockUser2 }); // target
      prisma.conversationParticipant.delete.mockResolvedValue({});
      prisma.message.create.mockResolvedValue({
        id: 'sys-msg-4',
        conversationId: 'group-1',
        senderId: 'user-1',
        content: 'Alice User removed Bob Colleague from the chat',
        isSystem: true,
        systemAction: 'MEMBER_REMOVED',
      });
      prisma.conversationParticipant.findMany
        .mockResolvedValueOnce([{ userId: 'user-1' }]) // remaining participants
        .mockResolvedValueOnce([
          {
            conversation: {
              id: 'group-1',
              type: 'GROUP',
              title: 'Project Alpha',
              participants: [{ id: 'p1', userId: 'user-1', role: 'ADMIN', user: mockUser1 }],
              messages: [],
            },
            userId: 'user-1',
          },
        ]);

      const res = await service.removeParticipant('group-1', 'user-1', 'user-2');
      expect(res.success).toBe(true);
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('user:user-2', 'chat:participant_removed', expect.anything());
    });
  });

  describe('C-003: Chat List Management (Pin, Mute, Hide, Unread)', () => {
    it('returns conversations with unreadCount and pin status', async () => {
      prisma.conversationParticipant.findMany.mockResolvedValue([
        {
          id: 'p1',
          conversationId: 'conv-1',
          userId: 'user-1',
          isPinned: true,
          isMuted: false,
          isHidden: false,
          lastReadAt: new Date(Date.now() - 3600000),
          visibleFrom: new Date(0),
          conversation: {
            id: 'conv-1',
            type: 'DIRECT',
            participants: [
              { id: 'p1', userId: 'user-1', role: 'MEMBER', user: mockUser1 },
              { id: 'p2', userId: 'user-2', role: 'MEMBER', user: mockUser2 },
            ],
            messages: [
              {
                id: 'm1',
                conversationId: 'conv-1',
                senderId: 'user-2',
                content: 'Latest message',
                createdAt: new Date(),
                updatedAt: new Date(),
                sender: mockUser2,
              },
            ],
          },
        },
      ]);
      prisma.message.count.mockResolvedValue(3);

      const convs = await service.getUserConversations('user-1');
      expect(convs).toHaveLength(1);
      expect(convs[0].isPinned).toBe(true);
      expect(convs[0].unreadCount).toBe(3);
    });

    it('toggles pin state on a conversation', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        id: 'p1',
        conversationId: 'conv-1',
        userId: 'user-1',
        isPinned: false,
      });
      prisma.conversationParticipant.update.mockResolvedValue({
        id: 'p1',
        isPinned: true,
      });
      prisma.conversationParticipant.findMany.mockResolvedValue([]);

      const res = await service.togglePin('conv-1', 'user-1');
      expect(res.success).toBe(true);
      expect(res.isPinned).toBe(true);
    });

    it('toggles mute state on a conversation', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        id: 'p1',
        conversationId: 'conv-1',
        userId: 'user-1',
        isMuted: false,
      });
      prisma.conversationParticipant.update.mockResolvedValue({
        id: 'p1',
        isMuted: true,
      });
      prisma.conversationParticipant.findMany.mockResolvedValue([]);

      const res = await service.toggleMute('conv-1', 'user-1');
      expect(res.success).toBe(true);
      expect(res.isMuted).toBe(true);
    });

    it('hides conversation and unhides automatically upon receiving a new message', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        id: 'p1',
        conversationId: 'conv-1',
        userId: 'user-1',
        isHidden: false,
      });
      prisma.conversationParticipant.update.mockResolvedValue({
        id: 'p1',
        isHidden: true,
      });

      const hideRes = await service.hideConversation('conv-1', 'user-1');
      expect(hideRes.success).toBe(true);
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith('user:user-1', 'chat:conversation_hidden', { conversationId: 'conv-1' });

      // When sending message, unhide updateMany is called
      prisma.conversationParticipant.updateMany.mockResolvedValue({ count: 1 });
      prisma.message.create.mockResolvedValue({
        id: 'msg-new',
        conversationId: 'conv-1',
        senderId: 'user-2',
        content: 'New ping',
        sender: mockUser2,
      });
      prisma.conversationParticipant.findMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);

      await service.sendMessage('conv-1', 'user-2', 'New ping');
      expect(prisma.conversationParticipant.updateMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-1', isHidden: true },
        data: { isHidden: false },
      });
    });

    it('marks conversation as unread by resetting lastReadAt', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        id: 'p1',
        conversationId: 'conv-1',
        userId: 'user-1',
        lastReadAt: new Date(),
      });
      prisma.conversationParticipant.update.mockResolvedValue({
        id: 'p1',
        lastReadAt: new Date(0),
      });
      prisma.conversationParticipant.findMany.mockResolvedValue([]);

      const res = await service.markAsUnread('conv-1', 'user-1');
      expect(res.success).toBe(true);
      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { lastReadAt: new Date(0) },
        }),
      );
    });
  });

  describe('toggleReaction (C-007)', () => {
    it('throws BadRequestException if emoji is missing or empty', async () => {
      await expect(service.toggleReaction('msg-1', 'user-1', '')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.toggleReaction('msg-1', 'user-1', '   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if message does not exist', async () => {
      prisma.message.findUnique.mockResolvedValue(null);
      await expect(service.toggleReaction('msg-nonexistent', 'user-1', '👍')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if user is not a participant in conversation', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        conversation: {
          participants: [{ userId: 'user-2' }],
        },
      });

      await expect(service.toggleReaction('msg-1', 'user-1', '👍')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('adds a reaction if user has not reacted with this emoji yet', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        conversation: {
          participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
        },
      });

      prisma.messageReaction.findUnique.mockResolvedValue(null);
      prisma.messageReaction.create.mockResolvedValue({
        id: 'reaction-1',
        messageId: 'msg-1',
        userId: 'user-1',
        emoji: '👍',
      });

      prisma.messageReaction.findMany.mockResolvedValue([
        {
          emoji: '👍',
          user: { id: 'user-1', displayName: 'Alice User' },
        },
      ]);

      const result = await service.toggleReaction('msg-1', 'user-1', '👍');

      expect(result.success).toBe(true);
      expect(result.action).toBe('added');
      expect(result.emoji).toBe('👍');
      expect(result.reactions).toEqual([
        {
          emoji: '👍',
          count: 1,
          users: [{ id: 'user-1', displayName: 'Alice User' }],
          hasReacted: true,
        },
      ]);
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith(
        'chat:conv-1',
        'chat:reaction',
        expect.objectContaining({
          conversationId: 'conv-1',
          messageId: 'msg-1',
        }),
      );
    });

    it('removes reaction if user has already reacted with this emoji', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        conversation: {
          participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
        },
      });

      prisma.messageReaction.findUnique.mockResolvedValue({
        id: 'reaction-1',
        messageId: 'msg-1',
        userId: 'user-1',
        emoji: '👍',
      });
      prisma.messageReaction.delete.mockResolvedValue({ id: 'reaction-1' });
      prisma.messageReaction.findMany.mockResolvedValue([]);

      const result = await service.toggleReaction('msg-1', 'user-1', '👍');

      expect(result.success).toBe(true);
      expect(result.action).toBe('removed');
      expect(result.reactions).toEqual([]);
      expect(eventsGateway.emitToRoom).toHaveBeenCalledWith(
        'chat:conv-1',
        'chat:reaction',
        expect.objectContaining({
          conversationId: 'conv-1',
          messageId: 'msg-1',
          reactions: [],
        }),
      );
    });
  });
});
