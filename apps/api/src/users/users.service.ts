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

  async getDirectory(
    query?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: MemberProfile[]; total: number; page: number; totalPages: number }> {
    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * take;

    const trimmed = query?.trim();
    const where: any = {
      isActive: true,
      ...(trimmed && {
        OR: [
          { displayName: { contains: trimmed, mode: 'insensitive' } },
          { email: { contains: trimmed, mode: 'insensitive' } },
          { jobTitle: { contains: trimmed, mode: 'insensitive' } },
          { department: { contains: trimmed, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { presence: true },
        orderBy: { displayName: 'asc' },
        skip,
        take,
      }),
    ]);

    const now = new Date();
    const localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const memberProfiles: MemberProfile[] = users.map((u) => ({
      ...this.sanitizeUser(u),
      presence: u.presence
        ? {
            status: u.presence.status,
            statusMessage: u.presence.statusMessage,
          }
        : {
            status: 'AVAILABLE',
            statusMessage: null,
          },
      localTime,
    }));

    return {
      users: memberProfiles,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take) || 1,
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
