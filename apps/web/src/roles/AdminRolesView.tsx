import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Text,
  Input,
  Select,
  Badge,
  Avatar,
  Spinner,
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  ShieldPersonRegular,
  PersonRegular,
  GlobePersonRegular,
  SearchRegular,
  ArrowSyncRegular,
  ShieldDismissRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../auth/AuthContext';
import { useUserRole } from './useUserRole';
import { rolesApi } from './roles.api';
import { RoleUser, RoleSummary, UserRole } from './types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    minWidth: 0,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
    minWidth: 0,
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginBottom: tokens.spacingVerticalL,
  },
  summaryCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    boxShadow: tokens.shadow2,
  },
  summaryValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  controlsBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginBottom: tokens.spacingVerticalL,
  },
  searchInput: {
    flexGrow: 1,
    maxWidth: '400px',
  },
  roleSelect: {
    minWidth: '150px',
  },
  tableCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding(tokens.spacingVerticalM),
    boxShadow: tokens.shadow2,
    minWidth: 0,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
    ':last-child': {
      borderBottomStyle: 'none',
    },
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    minWidth: 0,
    flexGrow: 1,
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  userNameRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  userName: {
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userSubtext: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  deniedContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    ...shorthands.padding(tokens.spacingVerticalXXL),
    textAlign: 'center',
  },
  deniedIcon: {
    fontSize: '64px',
    color: tokens.colorPaletteRedForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  emptyState: {
    textAlign: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL),
    color: tokens.colorNeutralForeground3,
  },
});

export const AdminRolesView: React.FC = () => {
  const styles = useStyles();
  const { token, user: currentUser } = useAuth();
  const { isAdmin } = useUserRole();

  const [users, setUsers] = useState<RoleUser[]>([]);
  const [summary, setSummary] = useState<RoleSummary | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !isAdmin) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [usersData, summaryData] = await Promise.all([
        rolesApi.fetchRoleUsers(token, search, roleFilter, 1, 50),
        rolesApi.fetchRoleSummary(token),
      ]);
      setUsers(usersData.users);
      setSummary(summaryData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load roles and users');
    } finally {
      setIsLoading(false);
    }
  }, [token, isAdmin, search, roleFilter]);

  useEffect(() => {
    if (isAdmin) {
      void loadData();
    }
  }, [isAdmin, loadData]);

  const handleRoleChange = async (targetUser: RoleUser, newRole: UserRole) => {
    if (!token || targetUser.role === newRole) return;

    setUpdatingUserId(targetUser.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await rolesApi.updateUserRole(token, targetUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u))
      );
      setSuccessMessage(
        `Successfully changed role for ${targetUser.displayName} to ${newRole}.`
      );
      const summaryData = await rolesApi.fetchRoleSummary(token);
      setSummary(summaryData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <Badge appearance="filled" color="brand" icon={<ShieldPersonRegular />}>
            Org Admin
          </Badge>
        );
      case 'MEMBER':
        return (
          <Badge appearance="tint" color="informative" icon={<PersonRegular />}>
            Member
          </Badge>
        );
      case 'GUEST':
        return (
          <Badge appearance="tint" color="warning" icon={<GlobePersonRegular />}>
            Guest
          </Badge>
        );
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // If user is not an administrator, show HTTP 403 Forbidden Access Denied state
  if (!isAdmin) {
    return (
      <div className={styles.deniedContainer} role="alert" aria-live="assertive">
        <div className={styles.deniedIcon} aria-hidden="true">
          <ShieldDismissRegular />
        </div>
        <Text size={500} weight="semibold" block style={{ marginBottom: '8px' }}>
          Access Denied (HTTP 403 Forbidden)
        </Text>
        <Text style={{ maxWidth: '480px', color: tokens.colorNeutralForeground3 }}>
          Administrator privileges are required to view and manage organizational
          roles. Standard members and guests cannot access administrative controls.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <ShieldPersonRegular fontSize={28} />
          <Text className={styles.title}>Admin Management Center — Roles</Text>
        </div>
        <Button
          appearance="subtle"
          icon={<ArrowSyncRegular />}
          onClick={() => void loadData()}
          aria-label="Refresh user roles"
        >
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className={styles.summaryGrid} aria-label="Role Summary Statistics">
          <div className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{summary.totalUsers}</Text>
            <Text className={styles.summaryLabel}>Total Members</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{summary.admins}</Text>
            <Text className={styles.summaryLabel}>Organization Admins</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{summary.members}</Text>
            <Text className={styles.summaryLabel}>Standard Members</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{summary.guests}</Text>
            <Text className={styles.summaryLabel}>External Guests</Text>
          </div>
        </div>
      )}

      {/* Error or Success banners */}
      {errorMessage && (
        <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {errorMessage}
          </MessageBarBody>
        </MessageBar>
      )}

      {successMessage && (
        <MessageBar intent="success" style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>
            <MessageBarTitle>Success</MessageBarTitle>
            {successMessage}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Search and filters */}
      <div className={styles.controlsBar}>
        <Input
          className={styles.searchInput}
          placeholder="Filter by name, email, department..."
          contentBefore={<SearchRegular />}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          aria-label="Search users"
        />
        <Select
          className={styles.roleSelect}
          value={roleFilter}
          onChange={(_, d) => setRoleFilter(d.value as any)}
          aria-label="Filter by role"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admins Only</option>
          <option value="MEMBER">Members Only</option>
          <option value="GUEST">Guests Only</option>
        </Select>
      </div>

      {/* Main user table */}
      <div className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Spinner label="Loading organizational users..." />
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No organizational users found.</Text>
          </div>
        ) : (
          <div role="list" aria-label="Organizational user roles">
            {users.map((targetUser) => {
              const isCurrent = targetUser.id === currentUser?.id;
              const isUpdating = updatingUserId === targetUser.id;

              return (
                <div key={targetUser.id} className={styles.userRow} role="listitem">
                  <div className={styles.userInfo}>
                    <Avatar
                      name={targetUser.displayName}
                      image={targetUser.avatarUrl ? { src: targetUser.avatarUrl } : undefined}
                      size={36}
                    />
                    <div className={styles.userDetails}>
                      <div className={styles.userNameRow}>
                        <Text className={styles.userName}>
                          {targetUser.displayName}
                        </Text>
                        {isCurrent && (
                          <Badge appearance="outline" size="small">
                            You
                          </Badge>
                        )}
                      </div>
                      <Text className={styles.userSubtext}>
                        {targetUser.email}
                        {targetUser.jobTitle ? ` · ${targetUser.jobTitle}` : ''}
                        {targetUser.department ? ` (${targetUser.department})` : ''}
                      </Text>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    {getRoleBadge(targetUser.role)}
                    <Select
                      aria-label={`Change role for ${targetUser.displayName}`}
                      value={targetUser.role}
                      disabled={isUpdating}
                      onChange={(_, d) =>
                        void handleRoleChange(targetUser, d.value as UserRole)
                      }
                      size="small"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="GUEST">Guest</option>
                    </Select>
                    {isUpdating && <Spinner size="tiny" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
