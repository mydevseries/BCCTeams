import { IsArray, IsString, IsOptional, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateGroupChatDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(249)
  @IsString({ each: true })
  recipientIds!: string[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;
}

