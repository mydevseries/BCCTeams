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
  Subtitle2,
  Caption1,
  Body1,
  Divider,
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
  WeatherMoonRegular,
  WeatherSunnyRegular,
} from '@fluentui/react-icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    height: '48px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('0', tokens.spacingHorizontalM),
    ...shorthands.gap(tokens.spacingHorizontalM),
    userSelect: 'none',
    zIndex: 100,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    cursor: 'pointer',
    minWidth: '160px',
  },
  logoImg: {
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusSmall,
  },
  logoText: {
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '-0.3px',
  },
  navControls: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  searchContainer: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '560px',
    ...shorthands.margin('0', 'auto'),
  },
  searchInput: {
    width: '100%',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginLeft: 'auto',
  },
  appBody: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAppBar: {
    width: '68px',
    minWidth: '68px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalS, '0'),
    ...shorthands.gap(tokens.spacingVerticalXS),
    userSelect: 'none',
    zIndex: 90,
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
      top: '14px',
      bottom: '14px',
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
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  listPaneHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '48px',
    ...shorthands.padding('0', tokens.spacingHorizontalM),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
  },
  listPaneContent: {
    flexGrow: 1,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
  },
  mainPane: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'auto',
  },
  emptyStateBox: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.gap(tokens.spacingVerticalM),
    maxWidth: '380px',
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
  emptyStateImg: {
    width: '180px',
    height: '140px',
  },
});

interface AppShellProps {
  currentTheme: 'light' | 'dark' | 'high-contrast';
  onThemeChange: (theme: 'light' | 'dark' | 'high-contrast') => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [presence, setPresence] = useState<'available' | 'busy' | 'away' | 'dnd'>('available');

  const navItems = [
    {
      id: 'activity',
      label: 'Activity',
      path: '/activity',
      iconRegular: <AlertRegular fontSize={22} />,
      iconFilled: <AlertFilled fontSize={22} />,
    },
    {
      id: 'chat',
      label: 'Chat',
      path: '/chat',
      iconRegular: <ChatRegular fontSize={22} />,
      iconFilled: <ChatFilled fontSize={22} />,
    },
    {
      id: 'teams',
      label: 'Teams',
      path: '/teams',
      iconRegular: <PeopleTeamRegular fontSize={22} />,
      iconFilled: <PeopleTeamFilled fontSize={22} />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      path: '/calendar',
      iconRegular: <CalendarLtrRegular fontSize={22} />,
      iconFilled: <CalendarLtrFilled fontSize={22} />,
    },
    {
      id: 'calls',
      label: 'Calls',
      path: '/calls',
      iconRegular: <CallRegular fontSize={22} />,
      iconFilled: <CallFilled fontSize={22} />,
    },
    {
      id: 'files',
      label: 'Files',
      path: '/files',
      iconRegular: <DocumentFolderRegular fontSize={22} />,
      iconFilled: <DocumentFolderFilled fontSize={22} />,
    },
    {
      id: 'apps',
      label: 'Apps',
      path: '/apps',
      iconRegular: <AppsRegular fontSize={22} />,
      iconFilled: <AppsFilled fontSize={22} />,
    },
  ];

  const currentTab = navItems.find((item) =>
    location.pathname.startsWith(item.path)
  ) || navItems[1]; // default to chat

  const presenceStatusMap = {
    available: { status: 'available' as const, label: 'Available' },
    busy: { status: 'busy' as const, label: 'Busy' },
    away: { status: 'away' as const, label: 'Away' },
    dnd: { status: 'do-not-disturb' as const, label: 'Do not disturb' },
  };

  return (
    <div className={styles.root}>
      {/* 1. TOP BAR */}
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
          <Subtitle2 className={styles.logoText}>BCC Teams</Subtitle2>
        </div>

        <div className={styles.navControls}>
          <Tooltip content="Back" relationship="label">
            <Button
              appearance="subtle"
              icon={<ArrowLeftRegular />}
              size="small"
              onClick={() => window.history.back()}
              aria-label="Back"
            />
          </Tooltip>
          <Tooltip content="Forward" relationship="label">
            <Button
              appearance="subtle"
              icon={<ArrowRightRegular />}
              size="small"
              onClick={() => window.history.forward()}
              aria-label="Forward"
            />
          </Tooltip>
        </div>

        <div className={styles.searchContainer}>
          <Input
            className={styles.searchInput}
            placeholder="Search messages, people, files (Ctrl+E)"
            contentBefore={<SearchRegular />}
            appearance="filled-darker"
            size="medium"
            aria-label="Global search"
          />
        </div>

        <div className={styles.topBarRight}>
          <Tooltip
            content={currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            relationship="label"
          >
            <Button
              appearance="subtle"
              icon={currentTheme === 'dark' ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
              onClick={() =>
                onThemeChange(currentTheme === 'dark' ? 'light' : 'dark')
              }
              aria-label="Toggle theme"
            />
          </Tooltip>

          {/* Profile & Presence Menu */}
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Tooltip content="Profile & Presence" relationship="label">
                <button
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="User Profile"
                >
                  <Avatar
                    name="Lead Engineer"
                    initials="LE"
                    badge={{ status: presenceStatusMap[presence].status }}
                    size={32}
                  />
                </button>
              </Tooltip>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <div style={{ padding: '8px 12px' }}>
                  <Body1 block style={{ fontWeight: 'bold' }}>
                    Lead Engineer
                  </Body1>
                  <Caption1 block style={{ color: tokens.colorNeutralForeground3 }}>
                    lead.engineer@bccteams.local
                  </Caption1>
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
                <Divider />
                <MenuItem icon={<SettingsRegular />} onClick={() => navigate('/settings')}>
                  Settings
                </MenuItem>
                <MenuItem icon={<SignOutRegular />} onClick={() => navigate('/signin')}>
                  Sign out
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </header>

      {/* APP BODY (Left bar + List pane + Main pane) */}
      <div className={styles.appBody}>
        {/* 2. LEFT APP BAR */}
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

        {/* 3. LIST PANE */}
        <aside className={styles.listPane} aria-label={`${currentTab?.label} list`}>
          <div className={styles.listPaneHeader}>
            <Subtitle2>{currentTab?.label}</Subtitle2>
          </div>
          <div className={styles.listPaneContent}>
            {/* Contextual list pane items */}
            {currentTab?.id === 'chat' && (
              <div>
                <Caption1 block style={{ marginBottom: '8px', color: tokens.colorNeutralForeground3 }}>
                  RECENT CHATS
                </Caption1>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: tokens.colorNeutralBackground1Selected,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Avatar name="General Chat" initials="GC" size={32} />
                  <div>
                    <Body1 block style={{ fontWeight: 600 }}>
                      General Chat
                    </Body1>
                    <Caption1 block style={{ color: tokens.colorNeutralForeground3 }}>
                      Welcome to BCC Teams!
                    </Caption1>
                  </div>
                </div>
              </div>
            )}
            {currentTab?.id !== 'chat' && (
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                No active {currentTab?.label.toLowerCase()} yet.
              </Caption1>
            )}
          </div>
        </aside>

        {/* 4. MAIN PANE */}
        <main className={styles.mainPane} role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
