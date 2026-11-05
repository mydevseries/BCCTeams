import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'high-contrast', 'system'])
  theme?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'fr', 'es', 'de'])
  language?: string;

  @IsOptional()
  @IsBoolean()
  notifyBanners?: boolean;

  @IsOptional()
  @IsBoolean()
  notifySounds?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyEmailDigest?: boolean;

  @IsOptional()
  @IsString()
  workingHoursStart?: string;

  @IsOptional()
  @IsString()
  workingHoursEnd?: string;

  @IsOptional()
  @IsString()
  workLocation?: string;

  @IsOptional()
  @IsBoolean()
  readReceipts?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['comfortable', 'compact'])
  chatDensity?: string;

  @IsOptional()
  @IsBoolean()
  enterToSend?: boolean;
}

