import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Avatar,
  Tooltip,
  Badge,
  Body1,
} from '@fluentui/react-components';
import {
  FilterRegular,
  ComposeRegular,
} from '@fluentui/react-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { navItems } from './AppBar';
import { useChat } from '../../chat/ChatContext';
import { ChatList } from '../../chat/ChatList';

const useStyles = makeStyles({
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
  listItemPreview: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export const ListPane: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { startDraftChat } = useChat();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mentions'>('all');

  const currentTab = navItems.find((item) =>
    location.pathname.startsWith(item.path)
  ) || (location.pathname.startsWith('/directory') ? { id: 'apps', label: 'Directory' } : navItems[1]);

  return (
    <aside className={styles.listPane} aria-label={`${currentTab?.label} list`}>
      <div className={styles.listPaneHeader}>
        <span className={styles.listPaneTitle}>{currentTab?.label}</span>
        <div className={styles.listPaneActions}>
          <Tooltip content="Filter" relationship="label">
            <Button appearance="subtle" icon={<FilterRegular fontSize={18} />} size="small" aria-label="Filter" />
          </Tooltip>
          <Tooltip content="New conversation" relationship="label">
            <Button
              appearance="subtle"
              icon={<ComposeRegular fontSize={18} />}
              size="small"
              aria-label="New conversation"
              onClick={() => {
                startDraftChat();
                if (!location.pathname.startsWith('/chat')) {
                  navigate('/chat');
                }
              }}
            />
          </Tooltip>
        </div>
      </div>

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
        {currentTab?.id === 'chat' && (
          <ChatList filter={activeFilter} />
        )}

        {currentTab?.id === 'activity' && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
              No activity notifications yet
            </Body1>
            <Badge appearance="tint" color="brand">Coming soon (A-001)</Badge>
          </div>
        )}

        {currentTab?.id === 'teams' && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
              No teams joined yet
            </Body1>
            <Badge appearance="tint" color="brand">Coming soon (T-001)</Badge>
          </div>
        )}

        {currentTab?.id === 'calendar' && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
              No scheduled events
            </Body1>
            <Badge appearance="tint" color="brand">Coming soon (W-001)</Badge>
          </div>
        )}

        {currentTab?.id === 'calls' && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
              No call history
            </Body1>
            <Badge appearance="tint" color="brand">Coming soon (K-001)</Badge>
          </div>
        )}

        {currentTab?.id === 'files' && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <Body1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '8px' }}>
              No files uploaded yet
            </Body1>
            <Badge appearance="tint" color="brand">Coming soon (D-001)</Badge>
          </div>
        )}

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
  );
};
