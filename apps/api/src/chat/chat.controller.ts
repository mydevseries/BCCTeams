import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
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
}

