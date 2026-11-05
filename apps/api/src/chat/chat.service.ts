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
import { ConversationSummary, ChatMessage, ChatParticipant } from '@bcc/shared';

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
      where: { userId },
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
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    // Extract all unique participant user IDs to batch-fetch presence
    const allUserIds = new Set<string>();
    for (const up of userParticipants) {
      for (const p of up.conversation.participants) {
        allUserIds.add(p.userId);
      }
    }
    const presenceMap = await this.presenceService.getBatchPresence(Array.from(allUserIds));

    return userParticipants.map((up) => {
      const conv = up.conversation;
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
        ? {
            id: conv.messages[0].id,
            conversationId: conv.messages[0].conversationId,
            senderId: conv.messages[0].senderId,
            content: conv.messages[0].content,
            isEdited: conv.messages[0].isEdited,
            isDeleted: conv.messages[0].isDeleted,
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
        otherParticipant,
      };
    });
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

    // Fetch full summary to return and emit
    const conversations = await this.getUserConversations(userId);
    const summary = conversations.find((c) => c.id === conv!.id)!;

    // Notify recipient's user room of conversation update
    this.eventsGateway.emitToRoom(`user:${recipientId}`, 'chat:conversation_updated', summary);
    this.eventsGateway.emitToRoom(`user:${userId}`, 'chat:conversation_updated', summary);

    return {
      conversation: summary,
      message: createdMessage,
    };
  }

  async getMessages(conversationId: string, userId: string, limit = 50) {
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

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
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
      },
    });

    // Mark conversation read for this user
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return messages;
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage> {
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

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim(),
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

    // Update sender's lastReadAt
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Broadcast message to chat room and to participant user rooms
    this.eventsGateway.emitToRoom(`chat:${conversationId}`, 'chat:message', message);

    const allParticipants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    for (const p of allParticipants) {
      this.eventsGateway.emitToRoom(`user:${p.userId}`, 'chat:message', message);
    }

    return message;
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

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return { success: true };
  }
}
