import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Badge,
  Caption1,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    height: '48px',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('0', tokens.spacingHorizontalL),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  chatTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  contentScroll: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
    overflowX: 'hidden',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalL),
  },
  innerContainer: {
    maxWidth: '560px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  emptyImg: {
    width: '220px',
    height: '150px',
    marginBottom: tokens.spacingVerticalM,
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '22px',
  },
  badgeCard: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    marginTop: tokens.spacingVerticalS,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
});

export const ChatView: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {/* Main pane header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.chatTitle}>Chat</span>
          <Badge appearance="tint" color="brand">Coming soon (C-001)</Badge>
        </div>
      </header>

      {/* Main pane content - clean empty state without fake composer */}
      <div className={styles.contentScroll}>
        <div className={styles.innerContainer}>
          <img
            src="/illustrations/empty-chat.svg"
            alt="BCC Teams Chat"
            className={styles.emptyImg}
          />
          <div className={styles.title}>Welcome to BCC Teams Chat</div>
          <div className={styles.description}>
            Real-time 1:1 and group messaging, rich text composer, emoji reactions,
            threaded replies, and file attachments will be available starting with Feature C-001.
          </div>

          <div className={styles.badgeCard}>
            <Badge appearance="tint" color="brand">Phase 2</Badge>
            <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
              Feature C-001: 1:1 Direct Messaging launching next
            </Caption1>
          </div>
        </div>
      </div>
    </div>
  );
};
