import { IsIn, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { PermissionAction } from '../permissions.interface';

const ALLOWED_ACTIONS: PermissionAction[] = [
  'MANAGE_ROLES',
  'VIEW_ADMIN_CENTER',
  'BROWSE_DIRECTORY',
  'MANAGE_SETTINGS',
  'ADD_MEMBER',
  'REMOVE_MEMBER',
  'PROMOTE_CO_OWNER',
  'MANAGE_TEAM',
  'DELETE_TEAM',
  'CREATE_CHANNEL',
  'DELETE_CHANNEL',
  'POST_MESSAGE',
  'ACCESS_CHANNEL',
];

export class CheckPermissionDto {
  @IsNotEmpty()
  @IsIn(ALLOWED_ACTIONS, {
    message: `Action must be a recognized permission action`,
  })
  action!: PermissionAction;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsIn(['OWNER', 'MEMBER'])
  teamRole?: 'OWNER' | 'MEMBER';

  @IsOptional()
  @IsBoolean()
  isChannelOwner?: boolean;

  @IsOptional()
  @IsBoolean()
  isChannelMember?: boolean;
}
