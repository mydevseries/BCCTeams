import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Avatar,
} from '@fluentui/react-components';
import { CheckmarkRegular } from '@fluentui/react-icons';
import { ChatMessage, MemberProfile } from '@bcc/shared';
import { RichTextRenderer } from './RichTextRenderer';
import { MessageReactionPicker } from './MessageReactionPicker';
import { MessageReactionBadges } from './MessageReactionBadges';

const useStyles = makeStyles({
  messageRow: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    maxWidth: '85%',
    position: 'relative',
    '&:hover .reaction-bar-container': {
      opacity: 1,
      pointerEvents: 'auto',
    },
    '&:focus-within .reaction-bar-container': {
      opacity: 1,
      pointerEvents: 'auto',
    },
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
    position: 'relative',
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
  statusReceipt: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  bubble: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase300,
    lineHeight: '20px',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    position: 'relative',
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
  reactionBarContainer: {
    position: 'absolute',
    top: '-16px',
    zIndex: 10,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.15s ease',
  },
  reactionBarOutgoing: {
    right: '0',
  },
  reactionBarIncoming: {
    left: '0',
  },
  reactionBarVisible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
});

interface MessageItemProps {
  message: ChatMessage;
  currentUserId?: string;
  currentUserDisplayName?: string;
  recipient?: MemberProfile | null;
  isRead?: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  currentUserDisplayName,
  recipient,
  isRead = false,
  onToggleReaction,
}) => {
  const styles = useStyles();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isOutgoing = message.senderId === currentUserId;
  const isOptimistic = message.id.startsWith('opt-');

  const senderDisplayName =
    message.sender?.displayName ||
    (isOutgoing ? currentUserDisplayName : recipient?.displayName) ||
    'Colleague';

  const formatMessageTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSelectReaction = (emoji: string) => {
    onToggleReaction(message.id, emoji);
  };

  return (
    <div
      className={`${styles.messageRow} ${isOutgoing ? styles.messageRowOutgoing : styles.messageRowIncoming}`}
      data-testid={`message-item-${message.id}`}
      tabIndex={0}
      role="article"
      aria-label={`Message from ${senderDisplayName}`}
    >
      <Avatar
        name={senderDisplayName}
        image={message.sender?.avatarUrl ? { src: message.sender.avatarUrl } : undefined}
        size={32}
      />

      <div className={styles.messageBody}>
        {/* Floating Quick Reaction Bar */}
        {!isOptimistic && (
          <div
            className={`reaction-bar-container ${styles.reactionBarContainer} ${
              isOutgoing ? styles.reactionBarOutgoing : styles.reactionBarIncoming
            } ${isPickerOpen ? styles.reactionBarVisible : ''}`}
            onMouseEnter={() => setIsPickerOpen(true)}
            onMouseLeave={() => setIsPickerOpen(false)}
            data-testid={`reaction-bar-${message.id}`}
          >
            <MessageReactionPicker onSelectReaction={handleSelectReaction} />
          </div>
        )}

        <div className={`${styles.messageHeader} ${isOutgoing ? styles.messageHeaderOutgoing : ''}`}>
          <span className={styles.senderName}>{senderDisplayName}</span>
          <span className={styles.timestamp}>{formatMessageTime(message.createdAt)}</span>

          {isOutgoing && (
            <span
              className={styles.statusReceipt}
              aria-label={isOptimistic ? 'Sending' : isRead ? 'Read' : 'Sent'}
              title={isOptimistic ? 'Sending...' : isRead ? 'Read by recipient' : 'Sent'}
            >
              {isRead ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: tokens.colorBrandForeground1,
                  }}
                >
                  <CheckmarkRegular fontSize={13} />
                  <CheckmarkRegular fontSize={13} style={{ marginLeft: -6 }} />
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: tokens.colorNeutralForeground4,
                    opacity: isOptimistic ? 0.6 : 1,
                  }}
                >
                  <CheckmarkRegular fontSize={13} />
                </span>
              )}
            </span>
          )}
        </div>

        <div
          className={`${styles.bubble} ${isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming}`}
        >
          <RichTextRenderer content={message.content} />
        </div>

        {/* Reaction Badges */}
        <MessageReactionBadges
          reactions={message.reactions}
          onToggleReaction={handleSelectReaction}
          isOutgoing={isOutgoing}
        />
      </div>
    </div>
  );
};

