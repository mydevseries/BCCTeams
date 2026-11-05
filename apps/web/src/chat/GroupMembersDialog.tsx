import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Input,
  RadioGroup,
  Radio,
  Badge,
  Spinner,
} from '@fluentui/react-components';
import {
  AddRegular,
  DismissRegular,
  DoorArrowLeftRegular,
  PeopleRegular,
} from '@fluentui/react-icons';
import { ConversationSummary, MemberProfile, HistoryShareOption } from '@bcc/shared';
import { useAuth } from '../auth/AuthContext';
import { usePresence } from '../presence/PresenceContext';
import { useChat } from './ChatContext';

const useStyles = makeStyles({
  surface: {
    maxWidth: '520px',
    width: '100%',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalM,
  },
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    maxHeight: '260px',
    overflowY: 'auto',
    ...shorthands.padding(tokens.spacingVerticalXS, '0'),
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  memberInfo: {
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
  },
  name: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  addSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    marginTop: tokens.spacingVerticalM,
  },
  userPickerWrapper: {
    position: 'relative',
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '180px',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16,
    zIndex: 100,
    marginTop: tokens.spacingVerticalXS,
  },
  searchItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  historyOptions: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
  daysInputRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginLeft: tokens.spacingHorizontalXXL,
    marginTop: tokens.spacingVerticalXS,
  },
});

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ConversationSummary;
}

export const GroupMembersDialog: React.FC<GroupMembersDialogProps> = ({
  open,
  onOpenChange,
  conversation,
}) => {
  const styles = useStyles();
  const { user, token } = useAuth();
  const { getUserPresence } = usePresence();
  const { addParticipant, removeParticipant, leaveGroup } = useChat();

  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemberProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<MemberProfile | null>(null);
  const [historyOption, setHistoryOption] = useState<HistoryShareOption>('none');
  const [historyDays, setHistoryDays] = useState(1);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search users for adding
  useEffect(() => {
    if (!token || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(`/api/users?query=${encodeURIComponent(searchQuery.trim())}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: MemberProfile[] = await res.json();
          const existingIds = new Set(conversation.participants.map((p) => p.userId));
          setSearchResults(data.filter((u) => !existingIds.has(u.id)));
        }
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, token, conversation.participants]);

  const handleAddMember = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await addParticipant(conversation.id, selectedUser.id, historyOption, historyDays);
      setSelectedUser(null);
      setSearchQuery('');
      setShowAdd(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    await removeParticipant(conversation.id, userId);
  };

  const handleLeave = async () => {
    await leaveGroup(conversation.id);
    onOpenChange(false);
  };

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
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogTitle className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PeopleRegular fontSize={24} />
            <span>Group Members ({conversation.participants.length})</span>
          </div>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          />
        </DialogTitle>

        <DialogBody>
          <DialogContent>
            {/* Member list */}
            <div className={styles.memberList}>
              {conversation.participants.map((p) => {
                const livePresence = getUserPresence(p.userId);
                const isCurrentUser = p.userId === user?.id;

                return (
                  <div key={p.id} className={styles.memberRow}>
                    <div className={styles.memberInfo}>
                      <Avatar
                        name={p.user.displayName}
                        image={p.user.avatarUrl ? { src: p.user.avatarUrl } : undefined}
                        badge={{ status: getFluentBadgeStatus(livePresence?.status) }}
                        size={32}
                      />
                      <div className={styles.details}>
                        <span className={styles.name}>
                          {p.user.displayName} {isCurrentUser && '(You)'}
                        </span>
                        <span className={styles.roleText}>
                          {p.role === 'ADMIN' ? 'Group Admin' : p.user.jobTitle || 'Member'}
                        </span>
                      </div>
                    </div>

                    {!isCurrentUser && (
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DismissRegular />}
                        onClick={() => handleRemoveMember(p.userId)}
                        aria-label={`Remove ${p.user.displayName}`}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add member section */}
            {showAdd ? (
              <div className={styles.addSection}>
                <span style={{ fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase300 }}>
                  Add people to chat
                </span>

                <div className={styles.userPickerWrapper}>
                  {selectedUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge appearance="tint" color="brand">
                        {selectedUser.displayName}
                      </Badge>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DismissRegular />}
                        onClick={() => setSelectedUser(null)}
                      />
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Type name or email of colleague"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        contentAfter={loadingSearch ? <Spinner size="extra-tiny" /> : undefined}
                      />
                      {searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                          {searchResults.map((m) => (
                            <div
                              key={m.id}
                              className={styles.searchItem}
                              onClick={() => {
                                setSelectedUser(m);
                                setSearchResults([]);
                                setSearchQuery('');
                              }}
                            >
                              <Avatar name={m.displayName} size={24} />
                              <span style={{ fontSize: tokens.fontSizeBase300 }}>{m.displayName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* History sharing options per acceptance criteria */}
                <div className={styles.historyOptions}>
                  <span style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 }}>
                    Chat history sharing:
                  </span>
                  <RadioGroup
                    value={historyOption}
                    onChange={(_, d) => setHistoryOption(d.value as HistoryShareOption)}
                  >
                    <Radio value="none" label="Don't include chat history" />
                    <Radio value="all" label="Include all chat history" />
                    <Radio value="days" label="Include history from the past number of days:" />
                  </RadioGroup>

                  {historyOption === 'days' && (
                    <div className={styles.daysInputRow}>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        style={{ width: '80px' }}
                        value={String(historyDays)}
                        onChange={(e) => setHistoryDays(Math.max(1, Number(e.target.value) || 1))}
                      />
                      <span style={{ fontSize: tokens.fontSizeBase200 }}>days</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button appearance="secondary" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                  <Button
                    appearance="primary"
                    disabled={!selectedUser || submitting}
                    onClick={handleAddMember}
                  >
                    {submitting ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                <Button
                  appearance="primary"
                  icon={<AddRegular />}
                  onClick={() => setShowAdd(true)}
                  disabled={conversation.participants.length >= 250}
                >
                  Add people
                </Button>
              </div>
            )}
          </DialogContent>

          <DialogActions style={{ justifyContent: 'space-between', marginTop: tokens.spacingVerticalL }}>
            <Button
              appearance="subtle"
              icon={<DoorArrowLeftRegular />}
              onClick={handleLeave}
              style={{ color: tokens.colorPaletteRedForeground1 }}
            >
              Leave group
            </Button>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

