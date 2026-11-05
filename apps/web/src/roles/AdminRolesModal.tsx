import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Select,
  Badge,
  Avatar,
  Spinner,
  Text,
  makeStyles,
  tokens,
  shorthands,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  DismissRegular,
  SearchRegular,
  ShieldPersonRegular,
  PersonRegular,
  GlobePersonRegular,
  ArrowSyncRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../auth/AuthContext';
import { rolesApi } from './roles.api';
import { RoleUser, RoleSummary, UserRole } from './types';

const useStyles = makeStyles({
  surface: {
    maxWidth: '720px',
    width: '90vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  summaryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  summaryValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginBottom: tokens.spacingVerticalM,
  },
  searchInput: {
    flexGrow: 1,
  },
  roleSelect: {
    minWidth: '130px',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    overflowY: 'auto',
    maxHeight: '380px',
    paddingRight: tokens.spacingHorizontalXS,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke3),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
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
  emptyState: {
    textAlign: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL),
    color: tokens.colorNeutralForeground3,
  },
});

interface AdminRolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminRolesModal: React.FC<AdminRolesModalProps> = ({
  open,
  onOpenChange,
}) => {
  const styles = useStyles();
  const { token, user: currentUser } = useAuth();

  const [users, setUsers] = useState<RoleUser[]>([]);
  const [summary, setSummary] = useState<RoleSummary | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !open) return;
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
  }, [token, open, search, roleFilter]);

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [open, loadData]);

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
        `Successfully updated ${targetUser.displayName} to ${newRole}.`
      );
      // Refresh summary statistics
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
          <Badge
            appearance="filled"
            color="brand"
            icon={<ShieldPersonRegular />}
          >
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

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface} aria-label="Role & Permissions Management">
        <DialogBody>
          <div className={styles.header}>
            <DialogTitle className={styles.headerTitle}>
              <ShieldPersonRegular fontSize={24} />
              Role & Permissions Management
            </DialogTitle>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              aria-label="Close dialog"
              onClick={() => onOpenChange(false)}
            />
          </div>

          <DialogContent>
            {/* Summary statistics */}
            {summary && (
              <div className={styles.summaryGrid} aria-label="Role Summary Statistics">
                <div className={styles.summaryCard}>
                  <Text className={styles.summaryValue}>{summary.totalUsers}</Text>
                  <Text className={styles.summaryLabel}>Total Members</Text>
                </div>
                <div className={styles.summaryCard}>
                  <Text className={styles.summaryValue}>{summary.admins}</Text>
                  <Text className={styles.summaryLabel}>Admins</Text>
                </div>
                <div className={styles.summaryCard}>
                  <Text className={styles.summaryValue}>{summary.members}</Text>
                  <Text className={styles.summaryLabel}>Members</Text>
                </div>
                <div className={styles.summaryCard}>
                  <Text className={styles.summaryValue}>{summary.guests}</Text>
                  <Text className={styles.summaryLabel}>Guests</Text>
                </div>
              </div>
            )}

            {/* Error or Success notification */}
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

            {/* Filters */}
            <div className={styles.filterBar}>
              <Input
                className={styles.searchInput}
                placeholder="Search by name, email, department..."
                contentBefore={<SearchRegular />}
                value={search}
                onChange={(_, d) => setSearch(d.value)}
                aria-label="Search organizational users"
              />
              <Select
                className={styles.roleSelect}
                value={roleFilter}
                onChange={(_, d) => setRoleFilter(d.value as any)}
                aria-label="Filter users by role"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins</option>
                <option value="MEMBER">Members</option>
                <option value="GUEST">Guests</option>
              </Select>
              <Button
                appearance="subtle"
                icon={<ArrowSyncRegular />}
                aria-label="Refresh user list"
                onClick={() => void loadData()}
              />
            </div>

            {/* User list */}
            {isLoading ? (
              <div className={styles.emptyState}>
                <Spinner label="Loading organizational users..." />
              </div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>
                <Text>No users found matching your search criteria.</Text>
              </div>
            ) : (
              <div className={styles.userList} role="list" aria-label="Users role list">
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
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
