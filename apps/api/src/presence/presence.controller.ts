import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PresenceService } from './presence.service';
import { UpdatePresenceDto, BatchPresenceDto } from './dto/update-presence.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PresenceState } from '@bcc/shared';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get('me')
  async getMyPresence(@Req() req: AuthenticatedRequest): Promise<PresenceState> {
    return this.presenceService.getPresence(req.user.id);
  }

  @Patch('me')
  async updateMyPresence(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePresenceDto,
  ): Promise<PresenceState> {
    return this.presenceService.updatePresence(req.user.id, dto);
  }

  @Post('batch')
  async getBatchPresence(
    @Body() dto: BatchPresenceDto,
  ): Promise<Record<string, PresenceState>> {
    return this.presenceService.getBatchPresence(dto.userIds);
  }

  @Get(':userId')
  async getUserPresence(@Param('userId') userId: string): Promise<PresenceState> {
    return this.presenceService.getPresence(userId);
  }
}

