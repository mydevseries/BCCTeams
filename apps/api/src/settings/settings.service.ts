import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserSettings } from '@bcc/shared';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string): Promise<UserSettings> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          theme: 'light',
          language: 'en',
          notifyBanners: true,
          notifySounds: true,
          notifyEmailDigest: true,
          workingHoursStart: '09:00',
          workingHoursEnd: '17:00',
          workLocation: 'Office',
          readReceipts: true,
          chatDensity: 'comfortable',
          enterToSend: true,
        },
      });
    }

    return {
      userId: settings.userId,
      theme: settings.theme,
      language: settings.language,
      notifyBanners: settings.notifyBanners,
      notifySounds: settings.notifySounds,
      notifyEmailDigest: settings.notifyEmailDigest,
      workingHoursStart: settings.workingHoursStart,
      workingHoursEnd: settings.workingHoursEnd,
      workLocation: settings.workLocation,
      readReceipts: settings.readReceipts,
      chatDensity: settings.chatDensity,
      enterToSend: settings.enterToSend,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<UserSettings> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: dto.theme || 'light',
        language: dto.language || 'en',
        notifyBanners: dto.notifyBanners ?? true,
        notifySounds: dto.notifySounds ?? true,
        notifyEmailDigest: dto.notifyEmailDigest ?? true,
        workingHoursStart: dto.workingHoursStart || '09:00',
        workingHoursEnd: dto.workingHoursEnd || '17:00',
        workLocation: dto.workLocation || 'Office',
        readReceipts: dto.readReceipts ?? true,
        chatDensity: dto.chatDensity || 'comfortable',
        enterToSend: dto.enterToSend ?? true,
      },
      update: {
        ...(dto.theme !== undefined && { theme: dto.theme }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.notifyBanners !== undefined && { notifyBanners: dto.notifyBanners }),
        ...(dto.notifySounds !== undefined && { notifySounds: dto.notifySounds }),
        ...(dto.notifyEmailDigest !== undefined && { notifyEmailDigest: dto.notifyEmailDigest }),
        ...(dto.workingHoursStart !== undefined && { workingHoursStart: dto.workingHoursStart }),
        ...(dto.workingHoursEnd !== undefined && { workingHoursEnd: dto.workingHoursEnd }),
        ...(dto.workLocation !== undefined && { workLocation: dto.workLocation }),
        ...(dto.readReceipts !== undefined && { readReceipts: dto.readReceipts }),
        ...(dto.chatDensity !== undefined && { chatDensity: dto.chatDensity }),
        ...(dto.enterToSend !== undefined && { enterToSend: dto.enterToSend }),
      },
    });

    return {
      userId: updated.userId,
      theme: updated.theme,
      language: updated.language,
      notifyBanners: updated.notifyBanners,
      notifySounds: updated.notifySounds,
      notifyEmailDigest: updated.notifyEmailDigest,
      workingHoursStart: updated.workingHoursStart,
      workingHoursEnd: updated.workingHoursEnd,
      workLocation: updated.workLocation,
      readReceipts: updated.readReceipts,
      chatDensity: updated.chatDensity,
      enterToSend: updated.enterToSend,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}

