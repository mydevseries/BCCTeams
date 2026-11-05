import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Input,
  Avatar,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  Tooltip,
  Divider,
  Badge,
  Body1,
} from '@fluentui/react-components';
import {
  AlertRegular,
  AlertFilled,
  ChatRegular,
  ChatFilled,
  PeopleTeamRegular,
  PeopleTeamFilled,
  CalendarLtrRegular,
  CalendarLtrFilled,
  CallRegular,
  CallFilled,
  DocumentFolderRegular,
  DocumentFolderFilled,
  AppsRegular,
  AppsFilled,
  SearchRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  SettingsRegular,
  SignOutRegular,
  PersonRegular,
  FilterRegular,
  ComposeRegular,
  PeopleSearchRegular,
} from '@fluentui/react-icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ProfileModal } from '../profile/ProfileModal';
import { SettingsModal } from '../settings/SettingsModal';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    boxSizing: 'border-box',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    height: '48px',
    minHeight: '48px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('0', tokens.spacingHorizontalM),
    ...shorthands.gap(tokens.spacingHorizontalM),
    userSelect: 'none',
    zIndex: 100,
    boxSizing: 'border-box',
    width: '100%',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    cursor: 'pointer',
    flexShrink: 0,
  },
  logoImg: {
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusSmall,
  },
  logoText: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    letterSpacing: '-0.2px',
  },
  navControls: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    flexShrink: 0,
  },
  searchContainer: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '640px',
    ...shorthands.margin('0', 'auto'),
  },
  searchInput: {
    width: '100%',
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginLeft: 'auto',
    flexShrink: 0,
  },
  appBody: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    minWidth: 0,
  },
  leftAppBar: {
    width: '68px',
    minWidth: '68px',
    maxWidth: '68px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalS, '0'),
    ...shorthands.gap(tokens.spacingVerticalXS),
    userSelect: 'none',
    zIndex: 90,
    flexShrink: 0,
  },
  appBarButton: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: 'transparent',
    ...shorthands.border('none', '0'),
    cursor: 'pointer',
    color: tokens.colorNeutralForeground2,
    ...shorthands.gap('2px'),
    transitionProperty: 'background-color, color',
    transitionDuration: tokens.durationFaster,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      color: tokens.colorNeutralForeground1,
    },
    '&:focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineColor: tokens.colorStrokeFocus2,
    },
  },
  appBarButtonActive: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground3Selected,
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '-6px',
      top: '12px',
      bottom: '12px',
      width: '3px',
      ...shorthands.borderRadius(tokens.borderRadiusCircular),
      backgroundColor: tokens.colorBrandForeground1,
    },
  },
  appBarLabel: {
    fontSize: '11px',
    lineHeight: '13px',
  },
  listPane: {
    width: '320px',
    minWidth: '260px',
    maxWidth: '480px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
    borderTopLeftRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    flexShrink: 0,
  },
  listPaneHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '48px',
    minHeight: '48px',
    ...shorthands.padding('0', tokens.spacingHorizontalM),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
    flexShrink: 0,
  },
  listPaneTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  listPaneActions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  filterPillsRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
  },
  filterPill: {
    fontSize: tokens.fontSizeBase200,
    ...shorthands.padding('2px', tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground2,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  filterPillActive: {
    backgroundColor: tokens.colorNeutralBackground2Selected,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      color: tokens.colorNeutralForeground1,
    },
  },
  listPaneContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding(tokens.spacingVerticalXS, '0'),
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    cursor: 'pointer',
    userSelect: 'none',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  listItemActive: {
    backgroundColor: tokens.colorNeutralBackground2Selected,
  },
  listItemText: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  listItemTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemTitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  listItemTitleUnread: {
    fontWeight: tokens.fontWeightSemibold,
  },
  listItemTime: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
    marginLeft: tokens.spacingHorizontalXS,
  },
  listItemPreview: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  mainPane: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
});

export const AppShell: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [presence, setPresence] = useState<'available' | 'busy' | 'dnd' | 'away' | 'offline'>('available');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mentions'>('all');

  const getInitials = (name?: string) => {
    if (!name) return 'BC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    {
      id: 'activity',
      label: 'Activity',
      path: '/activity',
      iconRegular: <AlertRegular fontSize={24} />,
      iconFilled: <AlertFilled fontSize={24} />,
    },
    {
      id: 'chat',
      label: 'Chat',
      path: '/chat',
      iconRegular: <ChatRegular fontSize={24} />,
      iconFilled: <ChatFilled fontSize={24} />,
    },
    {
      id: 'teams',
      label: 'Teams',
      path: '/teams',
      iconRegular: <PeopleTeamRegular fontSize={24} />,
      iconFilled: <PeopleTeamFilled fontSize={24} />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      path: '/calendar',
      iconRegular: <CalendarLtrRegular fontSize={24} />,
      iconFilled: <CalendarLtrFilled fontSize={24} />,
    },
    {
      id: 'calls',
      label: 'Calls',
      path: '/calls',
      iconRegular: <CallRegular fontSize={24} />,
      iconFilled: <CallFilled fontSize={24} />,
    },
    {
      id: 'files',
      label: 'Files',
      path: '/files',
      iconRegular: <DocumentFolderRegular fontSize={24} />,
      iconFilled: <DocumentFolderFilled fontSize={24} />,
    },
    {
      id: 'apps',
      label: 'Apps',
      path: '/apps',
      iconRegular: <AppsRegular fontSize={24} />,
      iconFilled: <AppsFilled fontSize={24} />,
    },
  ];

  const currentTab = navItems.find((item) =>
    location.pathname.startsWith(item.path)
  ) || (location.pathname.startsWith('/directory') ? { id: 'apps', label: 'Directory' } : navItems[1]);

  const presenceStatusMap = {
    available: { status: 'available' as const, label: 'Available' },
    busy: { status: 'busy' as const, label: 'Busy' },
    dnd: { status: 'do-not-disturb' as const, label: 'Do not disturb' },
    away: { status: 'away' as const, label: 'Away' },
    offline: { status: 'offline' as const, label: 'Appear offline' },
  };

  return (
    <div className={styles.root}>
      {/* 1. TOP BAR (48px tall) */}
      <header className={styles.topBar} role="banner">
        <div
          className={styles.logoContainer}
          onClick={() => navigate('/chat')}
          role="button"
          tabIndex={0}
          aria-label="BCC Teams Home"
        >
          <img
            src="/brand/favicon.svg"
            alt="BCC Teams Logo"
            className={styles.logoImg}
          />
          <span className={styles.logoText}>BCC Teams</span>
        </div>

        <div className={styles.navControls}>
          <Tooltip content="Back" relationship="label">
            <Button
              appearance="subtle"
              icon={<ArrowLeftRegular fontSize={18} />}
              size="small"
              onClick={() => window.history.back()}
              aria-label="Back"
            />
          </Tooltip>
          <Tooltip content="Forward" relationship="label">
            <Button
              appearance="subtle"
              icon={<ArrowRightRegular fontSize={18} />}
              size="small"
              onClick={() => window.history.forward()}
              aria-label="Forward"
            />
          </Tooltip>
        </div>

        <div className={styles.searchContainer}>
          <Input
            className={styles.searchInput}
            placeholder="Search (Ctrl+E)"
            contentBefore={<SearchRegular fontSize={18} />}
            appearance="filled-darker"
            size="medium"
            aria-label="Global search"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('/directory');
              }
            }}
          />
        </div>

        <div className={styles.topBarRight}>
          {/* Profile & Presence Menu */}
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
                  badge={{ status: presenceStatusMap[presence].status }}
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
                </div>
                <Divider />

                <MenuItem
                  icon={<PersonRegular />}
                  onClick={() => setPresence('available')}
                >
                  Available
                </MenuItem>
                <MenuItem
                  icon={<PersonRegular />}
                  onClick={() => setPresence('busy')}
                >
                  Busy
                </MenuItem>
                <MenuItem
                  icon={<PersonRegular />}
                  onClick={() => setPresence('dnd')}
                >
                  Do not disturb
                </MenuItem>
                <MenuItem
                  icon={<PersonRegular />}
                  onClick={() => setPresence('away')}
                >
                  Away
                </MenuItem>
                <MenuItem
                  icon={<PersonRegular />}
                  onClick={() => setPresence('offline')}
                >
                  Appear offline
                </MenuItem>
                <Divider />

                <MenuItem
                  icon={<PersonRegular />}
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  Set status message
                </MenuItem>
                <MenuItem
                  icon={<PeopleSearchRegular />}
                  onClick={() => navigate('/directory')}
                >
                  Organization directory
                </MenuItem>
                <MenuItem
                  icon={<PersonRegular />}
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  Edit profile
                </MenuItem>
                <MenuItem
                  icon={<SettingsRegular />}
                  onClick={() => setIsSettingsModalOpen(true)}
                >
                  Settings
                </MenuItem>
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
        </div>
      </header>

      {/* APP BODY (Left bar 68px + List pane 320px + Main pane) */}
      <div className={styles.appBody}>
        {/* 2. LEFT APP BAR (68px wide) */}
        <nav className={styles.leftAppBar} aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = currentTab?.id === item.id;
            return (
              <button
                key={item.id}
                className={`${styles.appBarButton} ${
                  isActive ? styles.appBarButtonActive : ''
                }`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive ? item.iconFilled : item.iconRegular}
                <span className={styles.appBarLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 3. LIST PANE (320px resizable) */}
        <aside className={styles.listPane} aria-label={`${currentTab?.label} list`}>
          <div className={styles.listPaneHeader}>
            <span className={styles.listPaneTitle}>{currentTab?.label}</span>
            <div className={styles.listPaneActions}>
              <Tooltip content="Filter" relationship="label">
                <Button appearance="subtle" icon={<FilterRegular fontSize={18} />} size="small" aria-label="Filter" />
              </Tooltip>
              <Tooltip content="New conversation" relationship="label">
                <Button appearance="subtle" icon={<ComposeRegular fontSize={18} />} size="small" aria-label="New" />
              </Tooltip>
            </div>
          </div>

          {/* Filter Pills */}
          <div className={styles.filterPillsRow}>
            <button
              className={`${styles.filterPill} ${activeFilter === 'all' ? styles.filterPillActive : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className={`${styles.filterPill} ${activeFilter === 'unread' ? styles.filterPillActive : ''}`}
              onClick={() => setActiveFilter('unread')}
            >
              Unread
            </button>
            <button
              className={`${styles.filterPill} ${activeFilter === 'mentions' ? styles.filterPillActive : ''}`}
              onClick={() => setActiveFilter('mentions')}
            >
              Mentions
            </button>
          </div>

          <div className={styles.listPaneContent}>
            {/* CHAT TAB LIST ITEMS */}
            {currentTab?.id === 'chat' && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
                  No conversations yet
                </Body1>
                <Badge appearance="tint" color="brand">Coming soon (C-001)</Badge>
              </div>
            )}

            {/* ACTIVITY TAB LIST ITEMS */}
            {currentTab?.id === 'activity' && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
                  No activity notifications yet
                </Body1>
                <Badge appearance="tint" color="brand">Coming soon (A-001)</Badge>
              </div>
            )}

            {/* TEAMS TAB LIST ITEMS */}
            {currentTab?.id === 'teams' && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
                  No teams joined yet
                </Body1>
                <Badge appearance="tint" color="brand">Coming soon (T-001)</Badge>
              </div>
            )}

            {/* CALENDAR TAB LIST ITEMS */}
            {currentTab?.id === 'calendar' && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
                  No scheduled events
                </Body1>
                <Badge appearance="tint" color="brand">Coming soon (W-001)</Badge>
              </div>
            )}

            {/* CALLS TAB LIST ITEMS */}
            {currentTab?.id === 'calls' && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
                  No call history
                </Body1>
                <Badge appearance="tint" color="brand">Coming soon (K-001)</Badge>
              </div>
            )}

            {/* FILES TAB LIST ITEMS */}
            {currentTab?.id === 'files' && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
                  No files uploaded yet
                </Body1>
                <Badge appearance="tint" color="brand">Coming soon (D-001)</Badge>
              </div>
            )}

            {/* APPS TAB LIST ITEMS */}
            {currentTab?.id === 'apps' && (
              <>
                <div className={styles.sectionHeader}>
                  <span>BUILT-IN APPS</span>
                </div>
                <div
                  className={`${styles.listItem} ${location.pathname.startsWith('/directory') ? styles.listItemActive : ''}`}
                  onClick={() => navigate('/directory')}
                >
                  <Avatar name="Directory" initials="OD" size={32} shape="square" />
                  <div className={styles.listItemText}>
                    <span className={`${styles.listItemTitle} ${styles.listItemTitleUnread}`}>
                      Organization Directory
                    </span>
                    <span className={styles.listItemPreview}>Colleague search and profiles</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* 4. MAIN PANE */}
        <main className={styles.mainPane} role="main">
          <Outlet />
          <ProfileModal
            open={isProfileModalOpen}
            onOpenChange={setIsProfileModalOpen}
          />
          <SettingsModal
            open={isSettingsModalOpen}
            onOpenChange={setIsSettingsModalOpen}
          />
        </main>
      </div>
    </div>
  );
};
