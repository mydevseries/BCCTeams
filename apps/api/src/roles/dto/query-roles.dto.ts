import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@bcc/shared';

export class QueryRolesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsIn(['ADMIN', 'MEMBER', 'GUEST', 'ALL'])
  role?: UserRole | 'ALL';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
