import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Avatar,
  Button,
  Tooltip,
} from '@fluentui/react-components';
import {
  CallRegular,
  VideoRegular,
} from '@fluentui/react-icons';
import { MemberProfile } from '@bcc/shared';
import { usePresence } from '../presence/PresenceContext';

const useStyles = makeStyles({
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
  participantInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    minWidth: 0,
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    ...shorthands.gap('2px'),
  },
  name: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  jobTitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    flexShrink: 0,
  },
});

interface ChatHeaderProps {
  participant: MemberProfile;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ participant }) => {
  const styles = useStyles();
  const { getUserPresence } = usePresence();

  const livePresence = getUserPresence(participant.id);

  const getFluentBadgeStatus = (status?: string): 'available' | 'busy' | 'do-not-disturb' | 'away' | 'offline' => {
    switch (status) {
      case 'AVAILABLE': return 'available';
      case 'BUSY': return 'busy';
      case 'DO_NOT_DISTURB': return 'do-not-disturb';
      case 'BE_RIGHT_BACK':
      case 'AWAY': return 'away';
      default: return 'offline';
    }
  };

  return (
    <header className={styles.header} aria-label={`Chat with ${participant.displayName}`}>
      <div className={styles.participantInfo}>
        <Avatar
          name={participant.displayName}
          image={participant.avatarUrl ? { src: participant.avatarUrl } : undefined}
          badge={{ status: getFluentBadgeStatus(livePresence?.status) }}
          size={32}
        />
        <div className={styles.details}>
          <span className={styles.name}>{participant.displayName}</span>
          <span className={styles.jobTitle}>
            {participant.jobTitle || participant.department || participant.email}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <Tooltip content="Audio call (Coming in Phase 7)" relationship="label">
          <Button
            appearance="subtle"
            icon={<CallRegular fontSize={20} />}
            aria-label="Audio call"
            size="medium"
          />
        </Tooltip>
        <Tooltip content="Video call (Coming in Phase 6)" relationship="label">
          <Button
            appearance="subtle"
            icon={<VideoRegular fontSize={20} />}
            aria-label="Video call"
            size="medium"
          />
        </Tooltip>
      </div>
    </header>
  );
};

