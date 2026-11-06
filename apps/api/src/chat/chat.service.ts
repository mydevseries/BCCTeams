import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { PresenceService } from '../presence/presence.service';
import { ConversationSummary, ChatMessage, ChatParticipant, MessageReactionSummary } from '@bcc/shared';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly presenceService: PresenceService,
  ) {}

  async getUserConversations(userId: string): Promise<ConversationSummary[]> {
    const userParticipants = await this.prisma.conversationParticipant.findMany({
      where: { userId, isHidden: false },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    displayName: true,
                    avatarUrl: true,
                    jobTitle: true,
                    department: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    email: true,
                    displayName: true,
                    avatarUrl: true,
                    jobTitle: true,
                    department: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { conversation: { updatedAt: 'desc' } },
      ],
    });

    // Extract all unique participant user IDs to batch-fetch presence
    const allUserIds = new Set<string>();
    for (const up of userParticipants) {
      for (const p of up.conversation?.participants || []) {
        allUserIds.add(p.userId);
      }
    }
    const presenceMap = await this.presenceService.getBatchPresence(Array.from(allUserIds));

    // Calculate unread count for each conversation (optimized: skip conversations with no newer messages)
    const unreadCounts = await Promise.all(
      userParticipants.map(async (up) => {
        const latestMsg = up.conversation?.messages?.[0];
        // If there are no messages, or the newest message is not newer than lastReadAt, count is 0
        if (!latestMsg || new Date(latestMsg.createdAt) <= new Date(up.lastReadAt)) {
          return 0;
        }
        return this.prisma.message.count({
          where: {
            conversationId: up.conversationId,
            createdAt: {
              gt: up.lastReadAt,
              gte: up.visibleFrom,
            },
            senderId: { not: userId },
          },
        });
      }),
    );

    return userParticipants
      .filter((up) => up.conversation)
      .map((up, i) => {
        const conv = up.conversation;
        const participants: ChatParticipant[] = (conv.participants || []).map((p) => {
          const pres = presenceMap[p.userId];
          return {
            id: p.id,
            conversationId: p.conversationId,
            userId: p.userId,
            role: p.role,
            joinedAt: p.joinedAt,
            lastReadAt: p.lastReadAt,
            isPinned: p.isPinned,
            isMuted: p.isMuted,
            user: {
              ...p.user,
              presence: pres
                ? {
                    status: pres.status,
                    statusMessage: pres.statusMessage,
                    statusExpiresAt: pres.statusExpiresAt,
                  }
                : null,
            },
          };
        });

        const otherParticipant =
          conv.type === 'DIRECT'
            ? participants.find((p) => p.userId !== userId)?.user
            : undefined;

        const lastMessage: ChatMessage | null = conv.messages[0]
          ? {
              id: conv.messages[0].id,
              conversationId: conv.messages[0].conversationId,
              senderId: conv.messages[0].senderId,
              content: conv.messages[0].content,
              isEdited: conv.messages[0].isEdited,
              isDeleted: conv.messages[0].isDeleted,
              isSystem: conv.messages[0].isSystem,
              systemAction: conv.messages[0].systemAction,
              createdAt: conv.messages[0].createdAt,
              updatedAt: conv.messages[0].updatedAt,
              sender: conv.messages[0].sender,
            }
          : null;

        return {
          id: conv.id,
          type: conv.type,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          participants,
          lastMessage,
          unreadCount: unreadCounts[i],
          isPinned: up.isPinned,
          isMuted: up.isMuted,
          isHidden: up.isHidden,
          otherParticipant,
        };
      });
  }

  /**
   * Fast targeted lookup of a single conversation summary without scanning all user conversations.
   */
  async getSingleConversationSummary(conversationId: string, userId: string): Promise<ConversationSummary | null> {
    const up = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    displayName: true,
                    avatarUrl: true,
                    jobTitle: true,
                    department: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    email: true,
                    displayName: true,
                    avatarUrl: true,
                    jobTitle: true,
                    department: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!up || !up.conversation) {
      const all = await this.getUserConversations(userId);
      return all.find((c) => c.id === conversationId) || null;
    }

    const conv = up.conversation;
    const allUserIds = conv.participants.map((p) => p.userId);
    const presenceMap = await this.presenceService.getBatchPresence(allUserIds);

    const participants: ChatParticipant[] = conv.participants.map((p) => {
      const pres = presenceMap[p.userId];
      return {
        id: p.id,
        conversationId: p.conversationId,
        userId: p.userId,
        role: p.role,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt,
        isPinned: p.isPinned,
        isMuted: p.isMuted,
        user: {
          ...p.user,
          presence: pres
            ? {
                status: pres.status,
                statusMessage: pres.statusMessage,
                statusExpiresAt: pres.statusExpiresAt,
              }
            : null,
        },
      };
    });

    const otherParticipant =
      conv.type === 'DIRECT'
        ? participants.find((p) => p.userId !== userId)?.user
        : undefined;

    const lastMessage: ChatMessage | null = conv.messages[0]
      ? ({
          id: conv.messages[0].id,
          conversationId: conv.messages[0].conversationId,
          senderId: conv.messages[0].senderId,
          content: conv.messages[0].content,
          isEdited: conv.messages[0].isEdited,
          isDeleted: conv.messages[0].isDeleted,
          isSystem: conv.messages[0].isSystem,
          systemAction: conv.messages[0].systemAction,
          createdAt: conv.messages[0].createdAt,
          updatedAt: conv.messages[0].updatedAt,
          sender: conv.messages[0].sender,
        } as unknown as ChatMessage)
      : null;

    return {
      id: conv.id,
      type: conv.type,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      participants,
      lastMessage,
      unreadCount: 0,
      isPinned: up.isPinned,
      isMuted: up.isMuted,
      isHidden: up.isHidden,
      otherParticipant,
    };
  }

  async getDirectConversation(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot start a 1:1 conversation with yourself');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    const pres = await this.presenceService.getPresence(recipientId);
    const recipientWithPresence = {
      ...recipient,
      presence: pres
        ? {
            status: pres.status,
            statusMessage: pres.statusMessage,
            statusExpiresAt: pres.statusExpiresAt,
          }
        : null,
    };

    // Find if a direct conversation already exists between these 2 users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                jobTitle: true,
                department: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                jobTitle: true,
                department: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return {
        exists: false,
        recipient: recipientWithPresence,
        conversation: null,
        messages: [],
      };
    }

    const currentPres = await this.presenceService.getPresence(userId);
    const participants: ChatParticipant[] = existing.participants.map((p) => {
      const pPres = p.userId === userId ? currentPres : pres;
      return {
        id: p.id,
        conversationId: p.conversationId,
        userId: p.userId,
        role: p.role,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt,
        isPinned: p.isPinned,
        isMuted: p.isMuted,
        user: {
          ...p.user,
          presence: pPres
            ? {
                status: pPres.status,
                statusMessage: pPres.statusMessage,
                statusExpiresAt: pPres.statusExpiresAt,
              }
            : null,
        },
      };
    });

    const conversationSummary: ConversationSummary = {
      id: existing.id,
      type: existing.type,
      title: existing.title,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
      participants,
      lastMessage: (existing.messages[existing.messages.length - 1] as any) || null,
      otherParticipant: recipientWithPresence,
    };

    return {
      exists: true,
      recipient: recipientWithPresence,
      conversation: conversationSummary,
      messages: existing.messages,
    };
  }

  async createOrGetDirectConversation(
    userId: string,
    recipientId: string,
    initialMessage?: string,
  ): Promise<{ conversation: ConversationSummary; message?: ChatMessage }> {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot start a 1:1 conversation with yourself');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    // Check if direct conversation already exists
    let conv = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: {
        participants: true,
      },
    });

    let createdMessage: any = null;

    if (!conv) {
      // Create new conversation with participants
      conv = await this.prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { userId, role: 'MEMBER' },
              { userId: recipientId, role: 'MEMBER' },
            ],
          },
        },
        include: {
          participants: true,
        },
      });

      this.logger.log(`Created 1:1 conversation ${conv.id} between ${userId} and ${recipientId}`);
    }

    if (initialMessage && initialMessage.trim().length > 0) {
      createdMessage = await this.prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: userId,
          content: initialMessage.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
              jobTitle: true,
              department: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      await this.prisma.conversation.update({
        where: { id: conv.id },
        data: { updatedAt: new Date() },
      });

      // Real-time broadcast
      this.eventsGateway.emitToRoom(`chat:${conv.id}`, 'chat:message', createdMessage);
      this.eventsGateway.emitToRoom(`user:${recipientId}`, 'chat:message', createdMessage);
      this.eventsGateway.emitToRoom(`user:${userId}`, 'chat:message', createdMessage);
    }

    // Fetch single conversation summary directly
    const summary = (await this.getSingleConversationSummary(conv!.id, userId))!;

    // Notify recipient's user room of conversation update
    this.eventsGateway.emitToRoom(`user:${recipientId}`, 'chat:conversation_updated', summary);
    this.eventsGateway.emitToRoom(`user:${userId}`, 'chat:conversation_updated', summary);

    return {
      conversation: summary,
      message: createdMessage,
    };
  }

  async createGroupConversation(
    creatorId: string,
    dto: { recipientIds: string[]; title?: string; initialMessage?: string },
  ): Promise<{ conversation: ConversationSummary; message?: ChatMessage }> {
    const uniqueRecipientIds = Array.from(new Set(dto.recipientIds.filter((id) => id !== creatorId)));
    if (uniqueRecipientIds.length === 0) {
      throw new BadRequestException('At least one recipient must be specified');
    }
    const totalCount = uniqueRecipientIds.length + 1;
    if (totalCount > 250) {
      throw new BadRequestException('Group chat cannot exceed 250 participants');
    }

    // Verify all recipients exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueRecipientIds } },
    });
    if (users.length !== uniqueRecipientIds.length) {
      throw new BadRequestException('One or more selected recipients could not be found');
    }

    const conv = await this.prisma.conversation.create({
      data: {
        type: 'GROUP',
        title: dto.title?.trim() || null,
        participants: {
          create: [
            { userId: creatorId, role: 'ADMIN', visibleFrom: new Date(0) },
            ...uniqueRecipientIds.map((userId) => ({
              userId,
              role: 'MEMBER' as const,
              visibleFrom: new Date(0),
            })),
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    let createdMessage: any = null;
    if (dto.initialMessage && dto.initialMessage.trim().length > 0) {
      createdMessage = await this.prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: creatorId,
          content: dto.initialMessage.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
              jobTitle: true,
              department: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      await this.prisma.conversation.update({
        where: { id: conv.id },
        data: { updatedAt: new Date() },
      });
    }

    const conversations = await this.getUserConversations(creatorId);
    const summary = conversations.find((c) => c.id === conv.id)!;

    // Real-time broadcast to all participants
    const allIds = [creatorId, ...uniqueRecipientIds];
    for (const uid of allIds) {
      this.eventsGateway.emitToRoom(`user:${uid}`, 'chat:conversation_updated', summary);
      if (createdMessage) {
        this.eventsGateway.emitToRoom(`user:${uid}`, 'chat:message', createdMessage);
      }
    }
    if (createdMessage) {
      this.eventsGateway.emitToRoom(`chat:${conv.id}`, 'chat:message', createdMessage);
    }

    return {
      conversation: summary,
      message: createdMessage,
    };
  }

  async updateConversationTitle(
    conversationId: string,
    userId: string,
    title: string,
  ): Promise<ConversationSummary> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      include: { user: true },
    });
    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    const newTitle = title.trim();
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title: newTitle, updatedAt: new Date() },
    });

    // Create system message
    const systemMessage = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: `${participant.user.displayName} named the group "${newTitle}"`,
        isSystem: true,
        systemAction: 'TITLE_CHANGED',
        metadata: { title: newTitle, changedBy: userId },
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            jobTitle: true,
            department: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const summary = (await this.getSingleConversationSummary(conversationId, userId))!;

    // Broadcast
    this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:conversation_updated', summary);
    this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:message', systemMessage);

    const allParticipants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    for (const p of allParticipants) {
      this.eventsGateway.emitToRoom(`user:${p.userId}`, 'chat:conversation_updated', summary);
      this.eventsGateway.emitToRoom(`user:${p.userId}`, 'chat:message', systemMessage);
    }

    return summary;
  }

  async addParticipant(
    conversationId: string,
    actorId: string,
    dto: { userId: string; historyOption?: 'none' | 'all' | 'days'; historyDays?: number },
  ) {
    const actorParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: actorId },
      },
      include: { user: true },
    });
    if (!actorParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const currentCount = await this.prisma.conversationParticipant.count({
      where: { conversationId },
    });
    if (currentCount >= 250) {
      throw new BadRequestException('Group chat cannot exceed 250 participants');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!targetUser) {
      throw new NotFoundException('User to add not found');
    }

    const existing = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: dto.userId },
      },
    });
    if (existing) {
      throw new BadRequestException('User is already a participant in this conversation');
    }

    let visibleFrom = new Date();
    if (dto.historyOption === 'all') {
      visibleFrom = new Date(0);
    } else if (dto.historyOption === 'days') {
      const days = dto.historyDays && dto.historyDays > 0 ? dto.historyDays : 1;
      visibleFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    await this.prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId: dto.userId,
        role: 'MEMBER',
        visibleFrom,
      },
    });

    const systemMessage = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: actorId,
        content: `${actorParticipant.user.displayName} added ${targetUser.displayName} to the chat`,
        isSystem: true,
        systemAction: 'MEMBER_ADDED',
        metadata: { addedUserId: dto.userId, addedBy: actorId, historyOption: dto.historyOption },
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            jobTitle: true,
            department: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const summary = (await this.getSingleConversationSummary(conversationId, actorId))!;

    this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:conversation_updated', summary);
    this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:message', systemMessage);

    const allParticipants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    for (const p of allParticipants) {
      this.eventsGateway.emitToRoom(`user:${p.userId}`, 'chat:conversation_updated', summary);
      this.eventsGateway.emitToRoom(`user:${p.userId}`, 'chat:message', systemMessage);
    }

    return { conversation: summary, message: systemMessage };
  }

  async removeParticipant(
    conversationId: string,
    actorId: string,
    targetUserId: string,
  ) {
    const actorParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: actorId },
      },
      include: { user: true },
    });
    if (!actorParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const targetParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: targetUserId },
      },
      include: { user: true },
    });
    if (!targetParticipant) {
      throw new NotFoundException('Participant not found in conversation');
    }

    const isSelfLeaving = actorId === targetUserId;

    // Delete participant
    await this.prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: { conversationId, userId: targetUserId },
      },
    });

    const actionText = isSelfLeaving
      ? `${targetParticipant.user.displayName} left the chat`
      : `${actorParticipant.user.displayName} removed ${targetParticipant.user.displayName} from the chat`;

    const systemMessage = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: actorId,
        content: actionText,
        isSystem: true,
        systemAction: isSelfLeaving ? 'MEMBER_LEFT' : 'MEMBER_REMOVED',
        metadata: {
          targetUserId,
          actorId,
          action: isSelfLeaving ? 'leave' : 'remove',
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            jobTitle: true,
            department: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Notify removed user
    this.eventsGateway.emitToRoom(`user:${targetUserId}`, 'chat:participant_removed', {
      conversationId,
      userId: targetUserId,
      message: systemMessage,
    });

    // Notify remaining participants
    const remaining = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    if (remaining.length > 0) {
      const summary = await this.getSingleConversationSummary(conversationId, remaining[0].userId);
      if (summary) {
        this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:conversation_updated', summary);
        this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:message', systemMessage);

        for (const p of remaining) {
          this.eventsGateway.emitToRoom(`user:${p.userId}`, 'chat:conversation_updated', summary);
          this.eventsGateway.emitToRoom(`user:${p.userId}`, 'chat:message', systemMessage);
        }
      }
    }

    return { success: true };
  }

  async getMessages(conversationId: string, userId: string, limit = 50, before?: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Build cursor condition for pagination: get messages BEFORE a given message id
    const whereClause: any = {
      conversationId,
      createdAt: {
        gte: participant.visibleFrom,
      },
    };

    if (before) {
      // Find the createdAt of the cursor message so we can paginate by time
      const cursorMsg = await this.prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (cursorMsg) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          lt: cursorMsg.createdAt,
        };
      }
    }

    // Fetch newest `limit` messages (descending), then reverse for display order
    const messages = await this.prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            jobTitle: true,
            department: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            senderId: true,
            content: true,
            sender: { select: { displayName: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, displayName: true } },
          },
        },
      },
    });

    // Reverse to chronological order for the client
    const chronological = messages.reverse();

    // Mark conversation read for this user (fire-and-forget)
    const readAt = new Date();
    void this.prisma.conversationParticipant
      .update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: readAt },
      })
      .then(() => {
        this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:read', {
          conversationId,
          userId,
          lastReadAt: readAt,
        });
      });

    const hasMore = messages.length === limit;

    return {
      messages: chronological.map((m: any) => ({
        ...m,
        replyTo: m.replyTo
          ? {
              id: m.replyTo.id,
              senderId: m.replyTo.senderId,
              senderDisplayName: m.replyTo.sender?.displayName,
              content: m.replyTo.content,
            }
          : null,
        reactions: this.formatReactions(m.reactions || [], userId),
      })),
      hasMore,
      // Oldest message id for the next page cursor
      nextCursor: hasMore && chronological.length > 0 ? chronological[0].id : null,
    };
  }

  async sendMessage(conversationId: string, senderId: string, content: string, replyToId?: string): Promise<ChatMessage> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const now = new Date();
    const [message, , , , allParticipants] = await Promise.all([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          content: content.trim(),
          ...(replyToId ? { replyToId } : {}),
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
              jobTitle: true,
              department: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              senderId: true,
              content: true,
              sender: { select: { displayName: true } },
            },
          },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: now },
      }),
      this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: senderId,
          },
        },
        data: {
          lastReadAt: now,
        },
      }),
      this.prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          isHidden: true,
        },
        data: {
          isHidden: false,
        },
      }),
      this.prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
      }),
    ]);

    // Broadcast message to chat room and to participant user rooms
    const broadcastMessage = {
      ...message,
      replyTo: message.replyTo
        ? {
            id: (message as any).replyTo.id,
            senderId: (message as any).replyTo.senderId,
            senderDisplayName: (message as any).replyTo.sender?.displayName,
            content: (message as any).replyTo.content,
          }
        : null,
    };
    this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:message', broadcastMessage);

    for (const p of allParticipants) {
      this.eventsGateway.emitToRoom(`user:${p.userId}`, 'chat:message', broadcastMessage);
    }

    return broadcastMessage as unknown as ChatMessage;
  }

  async markAsRead(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const readAt = new Date();
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: readAt,
      },
    });

    this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:read', {
      conversationId,
      userId,
      lastReadAt: readAt,
    });

    return { success: true };
  }

  async markAsUnread(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(0),
      },
    });

    const conversations = await this.getUserConversations(userId);
    const summary = conversations.find((c) => c.id === conversationId);
    if (summary) {
      this.eventsGateway.emitToRoom(`user:${userId}`, 'chat:conversation_updated', summary);
    }

    return { success: true };
  }

  async togglePin(conversationId: string, userId: string, isPinned?: boolean) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const nextPin = isPinned !== undefined ? isPinned : !participant.isPinned;

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        isPinned: nextPin,
      },
    });

    const conversations = await this.getUserConversations(userId);
    const summary = conversations.find((c) => c.id === conversationId);
    if (summary) {
      this.eventsGateway.emitToRoom(`user:${userId}`, 'chat:conversation_updated', summary);
    }

    return { success: true, isPinned: nextPin };
  }

  async toggleMute(conversationId: string, userId: string, isMuted?: boolean) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const nextMute = isMuted !== undefined ? isMuted : !participant.isMuted;

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        isMuted: nextMute,
      },
    });

    const conversations = await this.getUserConversations(userId);
    const summary = conversations.find((c) => c.id === conversationId);
    if (summary) {
      this.eventsGateway.emitToRoom(`user:${userId}`, 'chat:conversation_updated', summary);
    }

    return { success: true, isMuted: nextMute };
  }

  async hideConversation(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        isHidden: true,
      },
    });

    this.eventsGateway.emitToRoom(`user:${userId}`, 'chat:conversation_hidden', { conversationId });

    return { success: true };
  }

  /**
   * Helper to format raw reactions grouped by emoji.
   */
  public formatReactions(
    reactions: Array<{ emoji: string; user: { id: string; displayName: string } }>,
    currentUserId?: string,
  ): MessageReactionSummary[] {
    if (!reactions || reactions.length === 0) return [];
    const map = new Map<string, { count: number; users: Array<{ id: string; displayName: string }>; hasReacted: boolean }>();
    for (const r of reactions) {
      let entry = map.get(r.emoji);
      if (!entry) {
        entry = { count: 0, users: [], hasReacted: false };
        map.set(r.emoji, entry);
      }
      entry.count += 1;
      entry.users.push({ id: r.user.id, displayName: r.user.displayName });
      if (currentUserId && r.user.id === currentUserId) {
        entry.hasReacted = true;
      }
    }
    return Array.from(map.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      users: data.users,
      hasReacted: data.hasReacted,
    }));
  }

  /**
   * Toggle emoji reaction on a message.
   */
  async toggleReaction(messageId: string, userId: string, emoji: string) {
    if (!emoji || !emoji.trim()) {
      throw new BadRequestException('Emoji is required');
    }
    const cleanEmoji = emoji.trim();

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { participants: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const isParticipant = message.conversation?.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji: cleanEmoji,
        },
      },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji: cleanEmoji,
        },
      });
    }

    const rawReactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: { select: { id: true, displayName: true } },
      },
    });

    const reactionSummaries = this.formatReactions(rawReactions, userId);

    // Broadcast to chat room
    this.eventsGateway.emitToRoom(`chat:${message.conversationId}`, 'chat:reaction', {
      conversationId: message.conversationId,
      messageId,
      reactions: reactionSummaries,
    });

    return {
      success: true,
      action: existing ? 'removed' : 'added',
      emoji: cleanEmoji,
      reactions: reactionSummaries,
    };
  }
}
