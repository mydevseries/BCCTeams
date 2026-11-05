import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Avatar,
  Caption1,
  Body1,
} from '@fluentui/react-components';
import { useChat } from './ChatContext';
import { useAuth } from '../auth/AuthContext';
import { usePresence } from '../presence/PresenceContext';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
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
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Selected,
    },
  },
  itemContent: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  rowTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  title: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexGrow: 1,
  },
  titleUnread: {
    fontWeight: tokens.fontWeightSemibold,
  },
  time: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
    marginLeft: tokens.spacingHorizontalXS,
  },
  rowBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  preview: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptyState: {
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalM),
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
});

interface ChatListProps {
  filter: 'all' | 'unread' | 'mentions';
}

export const ChatList: React.FC<ChatListProps> = ({ filter }) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { getUserPresence } = usePresence();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
  } = useChat();

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

  const formatTimestamp = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (filter === 'unread') {
      const myParticipant = c.participants.find((p) => p.userId === user?.id);
      if (!myParticipant || !c.lastMessage) return false;
      return new Date(c.lastMessage.createdAt) > new Date(myParticipant.lastReadAt);
    }
    return true;
  });

  if (filteredConversations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Body1 style={{ color: tokens.colorNeutralForeground2 }}>
          {filter === 'unread' ? 'No unread chats' : 'No conversations yet'}
        </Body1>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Click the compose button above to start a 1:1 chat
        </Caption1>
      </div>
    );
  }

  return (
    <div className={styles.container} role="list" aria-label="Conversations list">
      {filteredConversations.map((conv) => {
        const otherParticipant =
          conv.type === 'DIRECT'
            ? conv.participants.find((p) => p.userId !== user?.id)?.user
            : undefined;

        const livePresence = otherParticipant ? getUserPresence(otherParticipant.id) : null;
        const displayName = otherParticipant?.displayName || conv.title || 'Conversation';
        const isActive = activeConversationId === conv.id;

        return (
          <div
            key={conv.id}
            role="listitem"
            className={`${styles.listItem} ${isActive ? styles.listItemActive : ''}`}
            onClick={() => setActiveConversationId(conv.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveConversationId(conv.id);
              }
            }}
          >
            <Avatar
              name={displayName}
              image={otherParticipant?.avatarUrl ? { src: otherParticipant.avatarUrl } : undefined}
              badge={{ status: getFluentBadgeStatus(livePresence?.status) }}
              size={32}
            />

            <div className={styles.itemContent}>
              <div className={styles.rowTop}>
                <span className={`${styles.title} ${styles.titleUnread}`}>
                  {displayName}
                </span>
                <span className={styles.time}>
                  {formatTimestamp(conv.lastMessage?.createdAt || conv.updatedAt)}
                </span>
              </div>

              <div className={styles.rowBottom}>
                <span className={styles.preview}>
                  {conv.lastMessage?.content || 'Draft conversation'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
