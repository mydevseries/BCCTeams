import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Request } from 'express';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getUserConversations(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.chatService.getUserConversations(user.id);
  }

  @Get('direct/:recipientId')
  async getDirectConversation(
    @Req() req: Request,
    @Param('recipientId') recipientId: string,
  ) {
    const user = req.user as { id: string };
    return this.chatService.getDirectConversation(user.id, recipientId);
  }

  @Post('conversations/direct')
  async createDirectConversation(
    @Req() req: Request,
    @Body() dto: CreateDirectChatDto,
  ) {
    const user = req.user as { id: string };
    return this.chatService.createOrGetDirectConversation(
      user.id,
      dto.recipientId,
      dto.initialMessage,
    );
  }

  @Post('conversations/group')
  async createGroupConversation(
    @Req() req: Request,
    @Body() dto: CreateGroupChatDto,
  ) {
    const user = req.user as { id: string };
    return this.chatService.createGroupConversation(user.id, dto);
  }

  @Patch('conversations/:id')
  async updateConversationTitle(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const user = req.user as { id: string };
    return this.chatService.updateConversationTitle(conversationId, user.id, dto.title);
  }

  @Post('conversations/:id/participants')
  async addParticipant(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Body() dto: AddParticipantDto,
  ) {
    const user = req.user as { id: string };
    return this.chatService.addParticipant(conversationId, user.id, dto);
  }

  @Delete('conversations/:id/participants/:targetUserId')
  async removeParticipant(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    const user = req.user as { id: string };
    return this.chatService.removeParticipant(conversationId, user.id, targetUserId);
  }

  @Post('conversations/:id/leave')
  async leaveConversation(
    @Req() req: Request,
    @Param('id') conversationId: string,
  ) {
    const user = req.user as { id: string };
    return this.chatService.removeParticipant(conversationId, user.id, user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
  ) {
    const user = req.user as { id: string };
    return this.chatService.getMessages(
      conversationId,
      user.id,
      limit ? Number(limit) : 50,
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const user = req.user as { id: string };
    return this.chatService.sendMessage(conversationId, user.id, dto.content);
  }

  @Post('conversations/:id/read')
  async markAsRead(
    @Req() req: Request,
    @Param('id') conversationId: string,
  ) {
    const user = req.user as { id: string };
    return this.chatService.markAsRead(conversationId, user.id);
  }

  @Post('conversations/:id/unread')
  async markAsUnread(
    @Req() req: Request,
    @Param('id') conversationId: string,
  ) {
    const user = req.user as { id: string };
    return this.chatService.markAsUnread(conversationId, user.id);
  }

  @Patch('conversations/:id/pin')
  async togglePin(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Body('isPinned') isPinned?: boolean,
  ) {
    const user = req.user as { id: string };
    return this.chatService.togglePin(conversationId, user.id, isPinned);
  }

  @Patch('conversations/:id/mute')
  async toggleMute(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Body('isMuted') isMuted?: boolean,
  ) {
    const user = req.user as { id: string };
    return this.chatService.toggleMute(conversationId, user.id, isMuted);
  }

  @Patch('conversations/:id/hide')
  async hideConversation(
    @Req() req: Request,
    @Param('id') conversationId: string,
  ) {
    const user = req.user as { id: string };
    return this.chatService.hideConversation(conversationId, user.id);
  }

  @Post('messages/:messageId/reactions')
  async toggleReaction(
    @Req() req: Request,
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
  ) {
    const user = req.user as { id: string };
    return this.chatService.toggleReaction(messageId, user.id, emoji);
  }
}
