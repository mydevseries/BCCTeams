import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserSettings } from '@bcc/shared';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('me')
  async getMySettings(@Request() req: any): Promise<UserSettings> {
    return this.settingsService.getSettings(req.user.id);
  }

  @Patch('me')
  async updateMySettings(
    @Request() req: any,
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserSettings> {
    return this.settingsService.updateSettings(req.user.id, dto);
  }
}
