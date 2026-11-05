import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Badge,
} from '@fluentui/react-components';
import { FilterRegular } from '@fluentui/react-icons';

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
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase500,
  },
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalL),
    textAlign: 'center',
  },
  emptyImg: {
    width: '200px',
    height: '140px',
    marginBottom: tokens.spacingVerticalM,
  },
  emptyTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
  },
  emptyDesc: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    maxWidth: '460px',
    lineHeight: '20px',
    marginBottom: tokens.spacingVerticalM,
  },
});

export const ActivityView: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.title}>Activity Feed</div>
        <Button appearance="subtle" icon={<FilterRegular />} aria-label="Filter activity" />
      </header>

      <div className={styles.content}>
        <img
          src="/illustrations/empty-activity.svg"
          alt="Activity Feed"
          className={styles.emptyImg}
        />
        <div className={styles.emptyTitle}>You're all caught up</div>
        <div className={styles.emptyDesc}>
          When colleagues mention you with @name, react to your messages, or miss a call,
          notifications and activity summaries will appear here in real time.
        </div>
        <Badge appearance="tint" color="brand">Coming soon (A-001)</Badge>
      </div>
    </div>
  );
};
