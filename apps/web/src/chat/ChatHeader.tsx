import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Avatar,
  AvatarGroup,
  Button,
  Input,
  Tooltip,
} from '@fluentui/react-components';
import {
  CallRegular,
  VideoRegular,
  EditRegular,
  CheckmarkRegular,
  PeopleRegular,
} from '@fluentui/react-icons';
import { ConversationSummary, MemberProfile } from '@bcc/shared';
import { usePresence } from '../presence/PresenceContext';
import { useChat } from './ChatContext';
import { GroupMembersDialog } from './GroupMembersDialog';

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
  leftInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    minWidth: 0,
    flexGrow: 1,
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    ...shorthands.gap('2px'),
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    minWidth: 0,
  },
  name: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
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
  editTitleInput: {
    maxWidth: '240px',
  },
});

interface ChatHeaderProps {
  conversation?: ConversationSummary | null;
  participant?: MemberProfile | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, participant }) => {
  const styles = useStyles();
  const { getUserPresence } = usePresence();
  const { updateGroupTitle } = useChat();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  const isGroup = conversation?.type === 'GROUP';

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

  const handleSaveTitle = async () => {
    if (conversation && editedTitle.trim()) {
      await updateGroupTitle(conversation.id, editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const startEditTitle = () => {
    setEditedTitle(conversation?.title || '');
    setIsEditingTitle(true);
  };

  // 1:1 Chat Header
  if (!isGroup) {
    const directUser = participant || conversation?.otherParticipant;
    if (!directUser) return null;
    const livePresence = getUserPresence(directUser.id);

    return (
      <header className={styles.header} aria-label={`Chat with ${directUser.displayName}`}>
        <div className={styles.leftInfo}>
          <Avatar
            name={directUser.displayName}
            image={directUser.avatarUrl ? { src: directUser.avatarUrl } : undefined}
            badge={{ status: getFluentBadgeStatus(livePresence?.status) }}
            size={32}
          />
          <div className={styles.details}>
            <span className={styles.name}>{directUser.displayName}</span>
            <span className={styles.subtitle}>
              {directUser.jobTitle || directUser.department || directUser.email}
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
  }

  // Group Chat Header
  const groupTitle =
    conversation.title ||
    conversation.participants
      .map((p) => p.user.displayName.split(' ')[0])
      .join(', ') ||
    'Group Chat';

  return (
    <>
      <header className={styles.header} aria-label={`Group chat: ${groupTitle}`}>
        <div className={styles.leftInfo}>
          <AvatarGroup layout="stack" size={32}>
            {conversation.participants.slice(0, 3).map((p) => (
              <Avatar
                key={p.id}
                name={p.user.displayName}
                image={p.user.avatarUrl ? { src: p.user.avatarUrl } : undefined}
              />
            ))}
          </AvatarGroup>

          <div className={styles.details}>
            {isEditingTitle ? (
              <div className={styles.titleRow}>
                <Input
                  className={styles.editTitleInput}
                  size="small"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  aria-label="Group name"
                />
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<CheckmarkRegular />}
                  onClick={handleSaveTitle}
                  aria-label="Save group name"
                />
              </div>
            ) : (
              <div className={styles.titleRow}>
                <span className={styles.name} title={groupTitle}>
                  {groupTitle}
                </span>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<EditRegular />}
                  onClick={startEditTitle}
                  aria-label="Edit group name"
                />
              </div>
            )}
            <span className={styles.subtitle}>
              {conversation.participants.length} participants
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            appearance="subtle"
            icon={<PeopleRegular />}
            onClick={() => setShowMembersDialog(true)}
            aria-label="View group members"
          >
            {conversation.participants.length} members
          </Button>
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

      {showMembersDialog && (
        <GroupMembersDialog
          open={showMembersDialog}
          onOpenChange={setShowMembersDialog}
          conversation={conversation}
        />
      )}
    </>
  );
};
