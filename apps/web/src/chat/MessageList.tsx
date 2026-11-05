import React, { useEffect, useRef } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Avatar,
  AvatarGroup,
} from '@fluentui/react-components';
import { PeopleRegular } from '@fluentui/react-icons';
import { ChatMessage, MemberProfile } from '@bcc/shared';
import { useAuth } from '../auth/AuthContext';
import { usePresence } from '../presence/PresenceContext';

const useStyles = makeStyles({
  container: {
    flexGrow: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  draftIntro: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalL),
    ...shorthands.gap(tokens.spacingVerticalS),
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  introName: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  introSubtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  introNotice: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    maxWidth: '440px',
    marginTop: tokens.spacingVerticalS,
  },
  messageRow: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    maxWidth: '85%',
  },
  messageRowOutgoing: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageRowIncoming: {
    alignSelf: 'flex-start',
  },
  messageBody: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  messageHeaderOutgoing: {
    flexDirection: 'row-reverse',
  },
  senderName: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  timestamp: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  bubble: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase300,
    lineHeight: '20px',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  bubbleOutgoing: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    borderTopRightRadius: '2px',
  },
  bubbleIncoming: {
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
    borderTopLeftRadius: '2px',
  },
  systemMessageRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    ...shorthands.gap(tokens.spacingHorizontalS),
    alignSelf: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    maxWidth: '80%',
    marginTop: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalXS,
  },
  systemMessageText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
  },
  systemMessageTime: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
  },
});

interface MessageListProps {
  messages: ChatMessage[];
  recipient?: MemberProfile | null;
  recipients?: MemberProfile[];
  isDraft: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  recipient,
  recipients = [],
  isDraft,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { getUserPresence } = usePresence();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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

  const formatMessageTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Draft intro
  if (isDraft && messages.length === 0) {
    if (recipient) {
      const livePresence = getUserPresence(recipient.id);
      return (
        <div className={styles.container}>
          <div className={styles.draftIntro}>
            <Avatar
              name={recipient.displayName}
              image={recipient.avatarUrl ? { src: recipient.avatarUrl } : undefined}
              badge={{ status: getFluentBadgeStatus(livePresence?.status) }}
              size={64}
            />
            <span className={styles.introName}>{recipient.displayName}</span>
            <span className={styles.introSubtitle}>
              {recipient.jobTitle || recipient.department || recipient.email}
            </span>
            <span className={styles.introNotice}>
              This is the start of your 1:1 conversation history with {recipient.displayName}. Send a message below to connect.
            </span>
          </div>
          <div ref={bottomRef} />
        </div>
      );
    }

    if (recipients.length > 1) {
      return (
        <div className={styles.container}>
          <div className={styles.draftIntro}>
            <AvatarGroup layout="stack" size={48}>
              {recipients.map((r) => (
                <Avatar
                  key={r.id}
                  name={r.displayName}
                  image={r.avatarUrl ? { src: r.avatarUrl } : undefined}
                />
              ))}
            </AvatarGroup>
            <span className={styles.introName}>New Group Conversation</span>
            <span className={styles.introSubtitle}>
              {recipients.map((r) => r.displayName).join(', ')}
            </span>
            <span className={styles.introNotice}>
              Start a new group chat with {recipients.length} colleagues. Send a message below to get started.
            </span>
          </div>
          <div ref={bottomRef} />
        </div>
      );
    }
  }

  return (
    <div className={styles.container} role="log" aria-label="Chat messages" aria-live="polite">
      {messages.map((msg) => {
        // System message rendering
        if (msg.isSystem) {
          return (
            <div key={msg.id} className={styles.systemMessageRow} role="status">
              <span className={styles.systemMessageText}>{msg.content}</span>
              <span className={styles.systemMessageTime}>{formatMessageTime(msg.createdAt)}</span>
            </div>
          );
        }

        const isOutgoing = msg.senderId === user?.id;
        const senderDisplayName =
          msg.sender?.displayName ||
          (isOutgoing ? user?.displayName : recipient?.displayName) ||
          'Colleague';

        return (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${isOutgoing ? styles.messageRowOutgoing : styles.messageRowIncoming}`}
          >
            <Avatar
              name={senderDisplayName}
              image={msg.sender?.avatarUrl ? { src: msg.sender.avatarUrl } : undefined}
              size={32}
            />

            <div className={styles.messageBody}>
              <div className={`${styles.messageHeader} ${isOutgoing ? styles.messageHeaderOutgoing : ''}`}>
                <span className={styles.senderName}>{senderDisplayName}</span>
                <span className={styles.timestamp}>{formatMessageTime(msg.createdAt)}</span>
              </div>

              <div
                className={`${styles.bubble} ${isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming}`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
