import React from 'react';
import {
  Avatar,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  Divider,
  tokens,
} from '@fluentui/react-components';
import {
  PersonRegular,
  PeopleSearchRegular,
  SettingsRegular,
  SignOutRegular,
  ShieldPersonRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { usePresence } from '../../presence/PresenceContext';
import { useUserRole } from '../../roles';

interface AvatarMenuProps {
  onOpenProfile: () => void;
  onOpenStatusMessage: () => void;
  onOpenSettings: () => void;
  onOpenAdminRoles?: () => void;
}

export const AvatarMenu: React.FC<AvatarMenuProps> = ({
  onOpenProfile,
  onOpenStatusMessage,
  onOpenSettings,
  onOpenAdminRoles,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { myPresence, setMyStatus } = usePresence();
  const { isAdmin } = useUserRole();

  const getFluentBadgeStatus = (status?: string): 'available' | 'busy' | 'do-not-disturb' | 'away' | 'offline' => {
    switch (status) {
      case 'AVAILABLE': return 'available';
      case 'BUSY': return 'busy';
      case 'DO_NOT_DISTURB': return 'do-not-disturb';
      case 'BE_RIGHT_BACK':
      case 'AWAY': return 'away';
      case 'OFFLINE':
      default: return 'offline';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'BC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <button
          type="button"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-label="User Profile"
        >
          <Avatar
            name={user?.displayName || 'User'}
            image={user?.avatarUrl ? { src: user.avatarUrl } : undefined}
            initials={getInitials(user?.displayName)}
            badge={{ status: getFluentBadgeStatus(myPresence.status) }}
            size={32}
          />
        </button>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {user?.displayName || 'User'}
            </div>
            <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
              {user?.email || 'user@bccteams.local'}
            </div>
            {myPresence.statusMessage && (
              <div
                style={{
                  fontSize: '12px',
                  color: tokens.colorNeutralForeground2,
                  marginTop: '6px',
                  wordBreak: 'break-word',
                }}
              >
                "{myPresence.statusMessage}"
              </div>
            )}
          </div>
          <Divider />

          <MenuItem icon={<PersonRegular />} onClick={() => void setMyStatus('AVAILABLE', true)}>
            Available
          </MenuItem>
          <MenuItem icon={<PersonRegular />} onClick={() => void setMyStatus('BUSY', true)}>
            Busy
          </MenuItem>
          <MenuItem icon={<PersonRegular />} onClick={() => void setMyStatus('DO_NOT_DISTURB', true)}>
            Do not disturb
          </MenuItem>
          <MenuItem icon={<PersonRegular />} onClick={() => void setMyStatus('BE_RIGHT_BACK', true)}>
            Be right back
          </MenuItem>
          <MenuItem icon={<PersonRegular />} onClick={() => void setMyStatus('AWAY', true)}>
            Away
          </MenuItem>
          <MenuItem icon={<PersonRegular />} onClick={() => void setMyStatus('OFFLINE', true)}>
            Appear offline
          </MenuItem>
          <Divider />

          <MenuItem icon={<PersonRegular />} onClick={onOpenStatusMessage}>
            Set status message
          </MenuItem>
          <MenuItem icon={<PeopleSearchRegular />} onClick={() => navigate('/directory')}>
            Organization directory
          </MenuItem>
          <MenuItem icon={<PersonRegular />} onClick={onOpenProfile}>
            Edit profile
          </MenuItem>
          <MenuItem icon={<SettingsRegular />} onClick={onOpenSettings}>
            Settings
          </MenuItem>
          {isAdmin && (
            <MenuItem icon={<ShieldPersonRegular />} onClick={onOpenAdminRoles}>
              Roles & Permissions
            </MenuItem>
          )}
          <Divider />

          <MenuItem
            icon={<SignOutRegular />}
            onClick={async () => {
              await logout();
              navigate('/signin');
            }}
          >
            Sign out
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

