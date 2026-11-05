import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDirectChatDto {
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @IsString()
  @IsOptional()
  initialMessage?: string;
}

