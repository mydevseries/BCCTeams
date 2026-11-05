import { UserRole } from '@bcc/shared';

export type OrgAction =
  | 'MANAGE_ROLES'
  | 'VIEW_ADMIN_CENTER'
  | 'BROWSE_DIRECTORY'
  | 'MANAGE_SETTINGS';

export type TeamAction =
  | 'ADD_MEMBER'
  | 'REMOVE_MEMBER'
  | 'PROMOTE_CO_OWNER'
  | 'MANAGE_TEAM'
  | 'DELETE_TEAM';

export type ChannelAction =
  | 'CREATE_CHANNEL'
  | 'DELETE_CHANNEL'
  | 'POST_MESSAGE'
  | 'ACCESS_CHANNEL';

export type PermissionAction = OrgAction | TeamAction | ChannelAction;

export interface PermissionContext {
  userId: string;
  role: UserRole;
  teamId?: string;
  channelId?: string;
  teamRole?: 'OWNER' | 'MEMBER';
  isChannelOwner?: boolean;
  isChannelMember?: boolean;
}

export interface IPermissionsService {
  checkPermission(context: PermissionContext, action: PermissionAction): Promise<boolean>;
  enforcePermission(context: PermissionContext, action: PermissionAction): Promise<void>;
}
