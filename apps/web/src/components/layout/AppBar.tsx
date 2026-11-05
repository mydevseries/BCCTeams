import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
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
} from '@fluentui/react-icons';
import { useLocation, useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
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
});

export const navItems = [
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

export const AppBar: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = navItems.find((item) =>
    location.pathname.startsWith(item.path)
  ) || (location.pathname.startsWith('/directory') ? { id: 'apps', label: 'Directory' } : navItems[1]);

  return (
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
  );
};

