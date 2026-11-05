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
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'relative',
    minHeight: '48px',
    ...shorthands.gap(tokens.spacingHorizontalM),
    flexShrink: 0,
  },
  toLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    flexShrink: 0,
  },
  inputWrapper: {
    flexGrow: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  input: {
    width: '100%',
    '& input': {
      fontSize: tokens.fontSizeBase300,
    },
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '360px',
    maxHeight: '280px',
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
  selectedTag: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
});

export const RecipientPicker: React.FC = () => {
  const styles = useStyles();
  const { token, user: currentUser } = useAuth();
  const { getUserPresence } = usePresence();
  const { activeRecipient, selectRecipient, startDraftChat } = useChat();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search for colleagues
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
          // Filter out current user from 1:1 recipient choices
          const filtered = data.filter((m) => m.id !== currentUser?.id);
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
  }, [query, token, currentUser?.id]);

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
    selectRecipient(member);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      <span className={styles.toLabel}>To:</span>

      <div className={styles.inputWrapper}>
        {activeRecipient ? (
          <div className={styles.selectedTag}>
            <Avatar
              name={activeRecipient.displayName}
              image={activeRecipient.avatarUrl ? { src: activeRecipient.avatarUrl } : undefined}
              size={24}
            />
            <span className={styles.name}>{activeRecipient.displayName}</span>
            <Button
              appearance="subtle"
              size="small"
              icon={<DismissRegular />}
              onClick={() => startDraftChat(null)}
              aria-label="Remove recipient"
            />
          </div>
        ) : (
          <Input
            ref={inputRef}
            className={styles.input}
            placeholder="Type the name or email of a colleague"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="New chat recipient"
            contentAfter={loading ? <Spinner size="extra-tiny" /> : undefined}
          />
        )}

        {isOpen && results.length > 0 && !activeRecipient && (
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
  );
};
