import React, { useState, useEffect, useRef } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Input,
  Avatar,
  Button,
  Spinner,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { MemberProfile } from '@bcc/shared';
import { useAuth } from '../auth/AuthContext';
import { usePresence } from '../presence/PresenceContext';
import { useChat } from './ChatContext';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'relative',
    minHeight: '48px',
    ...shorthands.gap(tokens.spacingVerticalXS),
    flexShrink: 0,
  },
  pickerRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    flexWrap: 'wrap',
    minHeight: '32px',
  },
  toLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    flexShrink: 0,
  },
  chipsContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding('2px', tokens.spacingHorizontalS),
    fontSize: tokens.fontSizeBase200,
  },
  inputWrapper: {
    flexGrow: 1,
    minWidth: '200px',
    position: 'relative',
  },
  input: {
    width: '100%',
    '& input': {
      fontSize: tokens.fontSizeBase300,
    },
  },
  groupTitleRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalXS,
  },
  groupTitleLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '360px',
    maxHeight: '260px',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16,
    zIndex: 1000,
    marginTop: tokens.spacingVerticalXS,
    display: 'flex',
    flexDirection: 'column',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  resultItemSelected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flexGrow: 1,
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
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export const RecipientPicker: React.FC = () => {
  const styles = useStyles();
  const { token, user: currentUser } = useAuth();
  const { getUserPresence } = usePresence();
  const {
    selectedRecipients,
    addDraftRecipient,
    removeDraftRecipient,
    draftTitle,
    setDraftTitle,
  } = useChat();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search colleagues
  useEffect(() => {
    if (!token || !query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?query=${encodeURIComponent(query.trim())}&limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: MemberProfile[] = await res.json();
          const selectedIds = new Set(selectedRecipients.map((r) => r.id));
          const filtered = data.filter((m) => m.id !== currentUser?.id && !selectedIds.has(m.id));
          setResults(filtered);
          setIsOpen(filtered.length > 0);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, token, currentUser?.id, selectedRecipients]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (member: MemberProfile) => {
    setQuery('');
    setIsOpen(false);
    addDraftRecipient(member);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && query === '' && selectedRecipients.length > 0) {
      removeDraftRecipient(selectedRecipients[selectedRecipients.length - 1].id);
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
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
    <div className={styles.container} ref={containerRef}>
      <div className={styles.pickerRow}>
        <span className={styles.toLabel}>To:</span>

        {/* Selected recipients chips */}
        <div className={styles.chipsContainer}>
          {selectedRecipients.map((recipient) => (
            <div key={recipient.id} className={styles.chip}>
              <Avatar
                name={recipient.displayName}
                image={recipient.avatarUrl ? { src: recipient.avatarUrl } : undefined}
                size={20}
              />
              <span>{recipient.displayName}</span>
              <Button
                appearance="subtle"
                size="small"
                icon={<DismissRegular />}
                onClick={() => removeDraftRecipient(recipient.id)}
                aria-label={`Remove ${recipient.displayName}`}
              />
            </div>
          ))}
        </div>

        <div className={styles.inputWrapper}>
          <Input
            ref={inputRef}
            className={styles.input}
            placeholder={
              selectedRecipients.length === 0
                ? 'Type the name or email of a colleague'
                : 'Add more people...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="New chat recipient"
            contentAfter={loading ? <Spinner size="extra-tiny" /> : undefined}
          />

          {isOpen && results.length > 0 && (
            <div className={styles.dropdown} role="listbox" aria-label="Colleague suggestions">
              {results.map((member, idx) => {
                const livePresence = getUserPresence(member.id);
                return (
                  <div
                    key={member.id}
                    role="option"
                    aria-selected={idx === selectedIndex}
                    className={`${styles.resultItem} ${idx === selectedIndex ? styles.resultItemSelected : ''}`}
                    onClick={() => handleSelect(member)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Avatar
                      name={member.displayName}
                      image={member.avatarUrl ? { src: member.avatarUrl } : undefined}
                      badge={{ status: getFluentBadgeStatus(livePresence?.status) }}
                      size={32}
                    />
                    <div className={styles.itemDetails}>
                      <span className={styles.name}>{member.displayName}</span>
                      <span className={styles.subtitle}>
                        {member.jobTitle || member.department || member.email}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Optional group name input if multiple recipients selected */}
      {selectedRecipients.length > 1 && (
        <div className={styles.groupTitleRow}>
          <span className={styles.groupTitleLabel}>Group name:</span>
          <Input
            size="small"
            placeholder="Name this group (optional)"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            aria-label="Group chat name"
            style={{ maxWidth: '300px' }}
          />
        </div>
      )}
    </div>
  );
};
