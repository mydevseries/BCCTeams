import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @IsNotEmpty({ message: 'Folder name is required' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class RenameItemDto {
  @IsNotEmpty({ message: 'New name is required' })
  @IsString()
  @MaxLength(255)
  name!: string;
}

export class MoveItemDto {
  @IsOptional()
  @IsString()
  targetParentId?: string | null;
}
