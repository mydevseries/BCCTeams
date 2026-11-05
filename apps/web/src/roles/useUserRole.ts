import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from './types';

export interface UserRolePermissions {
  role: UserRole;
  isAdmin: boolean;
  isMember: boolean;
  isGuest: boolean;
  canBrowseDirectory: boolean;
  canManageRoles: boolean;
  canManageTeam: (isTeamOwner?: boolean) => boolean;
  canDeleteChannel: (isChannelOwner?: boolean, isTeamOwner?: boolean) => boolean;
  canAccessChannel: (isChannelMember?: boolean) => boolean;
}

export const useUserRole = (): UserRolePermissions => {
  const { user } = useAuth();
  const role: UserRole = (user?.role as UserRole) || 'MEMBER';

  return useMemo(() => {
    const isAdmin = role === 'ADMIN';
    const isMember = role === 'MEMBER';
    const isGuest = role === 'GUEST';

    return {
      role,
      isAdmin,
      isMember,
      isGuest,
      // Guests cannot browse full org directories
      canBrowseDirectory: !isGuest,
      // Only organization admins can promote/demote or manage roles
      canManageRoles: isAdmin,
      // Team owners or org admins can add/remove members and promote co-owners
      canManageTeam: (isTeamOwner: boolean = false) => isAdmin || isTeamOwner,
      // Standard members cannot delete channels they do not own
      canDeleteChannel: (isChannelOwner: boolean = false, isTeamOwner: boolean = false) =>
        isAdmin || isTeamOwner || isChannelOwner,
      // Guests are restricted to specific channels they are invited to
      canAccessChannel: (isChannelMember: boolean = false) => {
        if (isGuest) {
          return isChannelMember;
        }
        return true;
      },
    };
  }, [role]);
};
