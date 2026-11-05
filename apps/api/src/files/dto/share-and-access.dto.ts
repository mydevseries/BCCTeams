import { IsIn, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateShareDto {
  @IsNotEmpty()
  @IsIn(['VIEW', 'EDIT'], { message: 'Permission must be VIEW or EDIT' })
  permission!: 'VIEW' | 'EDIT';

  @IsNotEmpty()
  @IsIn(['SPECIFIC_PEOPLE', 'ORGANIZATION', 'ANYONE_WITH_LINK'], {
    message: 'Scope must be SPECIFIC_PEOPLE, ORGANIZATION, or ANYONE_WITH_LINK',
  })
  scope!: 'SPECIFIC_PEOPLE' | 'ORGANIZATION' | 'ANYONE_WITH_LINK';

  @IsOptional()
  @IsString()
  sharedWithUserId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class CreateAccessRequestDto {
  @IsNotEmpty({ message: 'File ID is required' })
  @IsString()
  fileId!: string;

  @IsOptional()
  @IsIn(['VIEW', 'EDIT'])
  requestedPermission?: 'VIEW' | 'EDIT' = 'VIEW';

  @IsOptional()
  @IsString()
  note?: string;
}

export class ReviewAccessRequestDto {
  @IsNotEmpty()
  @IsIn(['APPROVED', 'DENIED'], { message: 'Status must be APPROVED or DENIED' })
  status!: 'APPROVED' | 'DENIED';

  @IsOptional()
  @IsIn(['VIEW', 'EDIT'])
  grantedPermission?: 'VIEW' | 'EDIT' = 'VIEW';
}
