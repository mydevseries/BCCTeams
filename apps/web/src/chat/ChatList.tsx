import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Avatar,
  Badge,
  Button,
  Caption1,
  Body1,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  PeopleRegular,
  PinRegular,
  PinOffRegular,
  SpeakerMuteRegular,
  Speaker2Regular,
  MailUnreadRegular,
  EyeOffRegular,
  MoreHorizontalRegular,
  ChevronDownRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { ConversationSummary } from '@bcc/shared';
import { useChat } from './ChatContext';
import { useAuth } from '../auth/AuthContext';
import { usePresence } from '../presence/PresenceContext';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflowY: 'auto',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    ...shorthands.gap(tokens.spacingHorizontalXS),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      color: tokens.colorNeutralForeground1,
    },
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
      '& $actionTrigger': {
        opacity: 1,
      },
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
    color: tokens.colorNeutralForeground1,
  },
  timeIconsRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    flexShrink: 0,
    marginLeft: tokens.spacingHorizontalXS,
  },
  time: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
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
    flexGrow: 1,
  },
  previewUnread: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  actionTrigger: {
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: tokens.durationFaster,
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
    togglePin,
    toggleMute,
    hideConversation,
    markAsUnread,
  } = useChat();

  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);

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
      return (c.unreadCount || 0) > 0;
    }
    return true;
  });

  const pinnedChats = filteredConversations.filter((c) => c.isPinned);
  const recentChats = filteredConversations.filter((c) => !c.isPinned);

  if (filteredConversations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Body1 style={{ color: tokens.colorNeutralForeground2 }}>
          {filter === 'unread' ? 'No unread chats' : 'No conversations yet'}
        </Body1>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Click the compose button above to start a chat
        </Caption1>
      </div>
    );
  }

  const renderChatItem = (conv: ConversationSummary) => {
    const isGroup = conv.type === 'GROUP';
    const otherParticipant = !isGroup
      ? conv.participants.find((p) => p.userId !== user?.id)?.user
      : undefined;

    const livePresence = otherParticipant ? getUserPresence(otherParticipant.id) : null;
    const displayName = isGroup
      ? conv.title ||
        conv.participants
          .filter((p) => p.userId !== user?.id)
          .map((p) => p.user.displayName.split(' ')[0])
          .join(', ') ||
        'Group Chat'
      : otherParticipant?.displayName || 'Direct Chat';

    const isActive = activeConversationId === conv.id;
    const isUnread = (conv.unreadCount || 0) > 0;

    const previewText = conv.lastMessage
      ? conv.lastMessage.isSystem
        ? conv.lastMessage.content
        : `${conv.lastMessage.senderId === user?.id ? 'You: ' : isGroup && conv.lastMessage.sender ? `${conv.lastMessage.sender.displayName.split(' ')[0]}: ` : ''}${conv.lastMessage.content}`
      : 'New conversation';

    return (
      <div
        key={conv.id}
        role="listitem"
        aria-label={`${displayName}${isUnread ? `, ${conv.unreadCount} unread messages` : ''}`}
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
          image={!isGroup && otherParticipant?.avatarUrl ? { src: otherParticipant.avatarUrl } : undefined}
          badge={!isGroup ? { status: getFluentBadgeStatus(livePresence?.status) } : undefined}
          icon={isGroup ? <PeopleRegular /> : undefined}
          size={32}
        />

        <div className={styles.itemContent}>
          <div className={styles.rowTop}>
            <span className={`${styles.title} ${isUnread ? styles.titleUnread : ''}`}>
              {displayName}
            </span>
            <div className={styles.timeIconsRow}>
              {conv.isMuted && (
                <SpeakerMuteRegular
                  fontSize={14}
                  style={{ color: tokens.colorNeutralForeground3 }}
                  aria-label="Muted"
                />
              )}
              {conv.isPinned && (
                <PinRegular
                  fontSize={14}
                  style={{ color: tokens.colorNeutralForeground3 }}
                  aria-label="Pinned"
                />
              )}
              <span className={styles.time}>
                {formatTimestamp(conv.lastMessage?.createdAt || conv.updatedAt)}
              </span>
            </div>
          </div>

          <div className={styles.rowBottom}>
            <span className={`${styles.preview} ${isUnread ? styles.previewUnread : ''}`}>
              {previewText}
            </span>

            {isUnread && (
              <Badge
                appearance="filled"
                color="brand"
                size="small"
                aria-label={`${conv.unreadCount} unread`}
              >
                {conv.unreadCount}
              </Badge>
            )}

            <div className={styles.actionTrigger} onClick={(e) => e.stopPropagation()}>
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<MoreHorizontalRegular />}
                    aria-label={`Options for ${displayName}`}
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem
                      icon={conv.isPinned ? <PinOffRegular /> : <PinRegular />}
                      onClick={() => togglePin(conv.id)}
                    >
                      {conv.isPinned ? 'Unpin' : 'Pin'}
                    </MenuItem>
                    <MenuItem
                      icon={conv.isMuted ? <Speaker2Regular /> : <SpeakerMuteRegular />}
                      onClick={() => toggleMute(conv.id)}
                    >
                      {conv.isMuted ? 'Unmute' : 'Mute'}
                    </MenuItem>
                    <MenuItem
                      icon={<MailUnreadRegular />}
                      onClick={() => markAsUnread(conv.id)}
                    >
                      Mark as unread
                    </MenuItem>
                    <MenuItem
                      icon={<EyeOffRegular />}
                      onClick={() => hideConversation(conv.id)}
                    >
                      Hide
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container} role="list" aria-label="Conversations list">
      {/* Pinned section */}
      {pinnedChats.length > 0 && (
        <div>
          <div
            className={styles.sectionHeader}
            onClick={() => setPinnedOpen(!pinnedOpen)}
            role="button"
            tabIndex={0}
            aria-expanded={pinnedOpen}
          >
            {pinnedOpen ? <ChevronDownRegular fontSize={12} /> : <ChevronRightRegular fontSize={12} />}
            <span>PINNED ({pinnedChats.length})</span>
          </div>
          {pinnedOpen && pinnedChats.map(renderChatItem)}
        </div>
      )}

      {/* Recent section */}
      {recentChats.length > 0 && (
        <div>
          {pinnedChats.length > 0 && (
            <div
              className={styles.sectionHeader}
              onClick={() => setRecentOpen(!recentOpen)}
              role="button"
              tabIndex={0}
              aria-expanded={recentOpen}
            >
              {recentOpen ? <ChevronDownRegular fontSize={12} /> : <ChevronRightRegular fontSize={12} />}
              <span>RECENT ({recentChats.length})</span>
            </div>
          )}
          {recentOpen && recentChats.map(renderChatItem)}
        </div>
      )}
    </div>
  );
};
