import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class AddParticipantDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsIn(['none', 'all', 'days'])
  historyOption?: 'none' | 'all' | 'days';

  @IsOptional()
  @IsInt()
  @Min(1)
  historyDays?: number;
}

