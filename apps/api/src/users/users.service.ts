import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfile, MemberProfile } from '@bcc/shared';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName.trim() }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle?.trim() || null }),
        ...(dto.department !== undefined && { department: dto.department?.trim() || null }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber?.trim() || null }),
      },
    });

    return this.sanitizeUser(updated);
  }

  async updateAvatar(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string,
    _originalName?: string
  ): Promise<UserProfile> {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      throw new BadRequestException('Invalid image format. Allowed formats: PNG, JPEG, WebP');
    }

    // 5MB max size
    const maxSizeBytes = 5 * 1024 * 1024;
    if (fileBuffer.length > maxSizeBytes) {
      throw new BadRequestException('Image file size exceeds the 5MB limit');
    }

    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `${userId}-${Date.now()}.${extension}`;
    const filePath = path.join(this.uploadDir, fileName);

    fs.writeFileSync(filePath, fileBuffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return this.sanitizeUser(updated);
  }

  async removeAvatar(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    // If there was an existing file, clean it up optionally
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      const fileName = path.basename(user.avatarUrl);
      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // Ignore deletion error
        }
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    return this.sanitizeUser(updated);
  }

  async getUserProfile(userId: string): Promise<MemberProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        presence: true,
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const base = this.sanitizeUser(user);

    return {
      ...base,
      presence: user.presence
        ? {
            status: user.presence.status,
            statusMessage: user.presence.statusMessage,
          }
        : {
            status: 'AVAILABLE',
            statusMessage: null,
          },
      localTime,
    };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    phoneNumber: string | null;
    role: 'ADMIN' | 'MEMBER' | 'GUEST';
    createdAt: Date;
    updatedAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      jobTitle: user.jobTitle,
      department: user.department,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
