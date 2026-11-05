import { IsEnum, IsOptional, IsString, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { PresenceStatus } from '@prisma/client';

export class UpdatePresenceDto {
  @IsOptional()
  @IsEnum(PresenceStatus)
  status?: PresenceStatus;

  @IsOptional()
  @IsString()
  statusMessage?: string | null;

  @IsOptional()
  @IsDateString()
  statusExpiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  isManual?: boolean;

  @IsOptional()
  @IsBoolean()
  clearMessage?: boolean;
}

export class BatchPresenceDto {
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];
}

