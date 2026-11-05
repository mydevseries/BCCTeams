import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@bcc/shared';
import { PermissionAction } from './permissions.interface';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const RequireAdmin = () => Roles('ADMIN');
export const RequireOrgMember = () => Roles('ADMIN', 'MEMBER');

export const PERMISSION_ACTION_KEY = 'permission_action';
export const RequirePermission = (action: PermissionAction) =>
  SetMetadata(PERMISSION_ACTION_KEY, action);
