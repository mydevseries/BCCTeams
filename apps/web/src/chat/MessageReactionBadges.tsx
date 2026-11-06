import React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import { MessageReactionSummary } from '@bcc/shared';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('4px'),
    marginTop: '4px',
  },
  containerOutgoing: {
    justifyContent: 'flex-end',
  },
  containerIncoming: {
    justifyContent: 'flex-start',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    ...shorthands.padding('2px', '6px'),
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground1,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1Hover),
    },
  },
  badgeActive: {
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  count: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
});

interface MessageReactionBadgesProps {
  reactions?: MessageReactionSummary[];
  onToggleReaction: (emoji: string) => void;
  isOutgoing?: boolean;
}

export const MessageReactionBadges: React.FC<MessageReactionBadgesProps> = ({
  reactions,
  onToggleReaction,
  isOutgoing = false,
}) => {
  const styles = useStyles();

  if (!reactions || reactions.length === 0) return null;

  return (
    <div
      className={`${styles.container} ${isOutgoing ? styles.containerOutgoing : styles.containerIncoming}`}
      role="group"
      aria-label="Message reactions"
    >
      {reactions.map((r) => {
        const userListText = r.users.map((u) => u.displayName).join(', ');
        return (
          <Tooltip
            key={r.emoji}
            content={userListText || `${r.count} reaction`}
            relationship="description"
          >
            <button
              type="button"
              className={`${styles.badge} ${r.hasReacted ? styles.badgeActive : ''}`}
              onClick={() => onToggleReaction(r.emoji)}
              aria-label={`${r.emoji} ${r.count} reacted by ${userListText}`}
              data-testid={`reaction-badge-${r.emoji}`}
            >
              <span aria-hidden="true">{r.emoji}</span>
              <span className={styles.count}>{r.count}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

