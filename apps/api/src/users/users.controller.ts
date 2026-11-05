import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProfile, MemberProfile } from '@bcc/shared';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest): Promise<UserProfile> {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto
  ): Promise<UserProfile> {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
    @Body('dataUrl') dataUrl?: string
  ): Promise<UserProfile> {
    if (file) {
      return this.usersService.updateAvatar(
        req.user.id,
        file.buffer,
        file.mimetype,
        file.originalname
      );
    }

    if (dataUrl && dataUrl.startsWith('data:')) {
      const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!match) {
        throw new BadRequestException('Invalid data URL format for image');
      }
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      return this.usersService.updateAvatar(req.user.id, buffer, mimeType);
    }

    throw new BadRequestException('Please provide an image file or dataUrl');
  }

  @Delete('me/avatar')
  async removeAvatar(@Req() req: AuthenticatedRequest): Promise<UserProfile> {
    return this.usersService.removeAvatar(req.user.id);
  }

  @Get()
  async getDirectory(
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<{ users: MemberProfile[]; total: number; page: number; totalPages: number }> {
    return this.usersService.getDirectory(query, page, limit);
  }

  @Get(':id')
  async getUserProfile(@Param('id') id: string): Promise<MemberProfile> {
    return this.usersService.getUserProfile(id);
  }
}
