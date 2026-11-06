import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Avatar, makeStyles, tokens, shorthands, Caption1, Body1, Spinner, Badge } from '@fluentui/react-components';
import { SearchRegular, DismissRegular, HistoryRegular, PersonAddRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { usePresence } from '../../presence/PresenceContext';
import { MemberProfile } from '@bcc/shared';

const useStyles = makeStyles({
  container: { position: 'relative', width: '100%', maxWidth: '640px', ...shorthands.margin('0', 'auto') },
  input: { width: '100%', ...shorthands.borderRadius(tokens.borderRadiusCircular) },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16, maxHeight: '420px', overflowY: 'auto', zIndex: 1000,
    ...shorthands.padding(tokens.spacingVerticalXS, '0'),
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase100, fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.5px',
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
  },
  itemRow: {
    display: 'flex', alignItems: 'center', ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    cursor: 'pointer', userSelect: 'none',
    '&:hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  itemRowSelected: { backgroundColor: tokens.colorNeutralBackground1Selected },
  itemText: { flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  title: { fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  subtitle: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
});

interface SearchBoxProps {
  onSelectMember?: (member: MemberProfile) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ onSelectMember }) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { getUserPresence, subscribeUsers } = usePresence();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [people, setPeople] = useState<MemberProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bcc_recent_searches') || '[]'); } catch { return []; }
  });
  const [recentPeople, setRecentPeople] = useState<MemberProfile[]>(() => {
    try { return JSON.parse(localStorage.getItem('bcc_recent_people') || '[]'); } catch { return []; }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchCacheRef = useRef<Map<string, MemberProfile[]>>(new Map());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) { setPeople([]); setIsLoading(false); return; }

    if (searchCacheRef.current.has(trimmed)) {
      const found = searchCacheRef.current.get(trimmed)!;
      setPeople(found);
      subscribeUsers(found.map((u) => u.id));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?query=${encodeURIComponent(query.trim())}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const found: MemberProfile[] = data.users || [];
          searchCacheRef.current.set(trimmed, found);
          setPeople(found);
          subscribeUsers(found.map((u) => u.id));
        }
      } catch { /* ignore */ } finally { setIsLoading(false); }
    }, 120);
    return () => clearTimeout(timer);
  }, [query, token, subscribeUsers]);

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('bcc_recent_searches', JSON.stringify(updated));
  };

  const handleSelectPerson = useCallback((person: MemberProfile) => {
    const updated = [person, ...recentPeople.filter((p) => p.id !== person.id)].slice(0, 5);
    setRecentPeople(updated);
    localStorage.setItem('bcc_recent_people', JSON.stringify(updated));
    setIsOpen(false);
    onSelectMember?.(person);
  }, [recentPeople, onSelectMember]);

  const executeFullSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setIsOpen(false);
    navigate(`/directory?query=${encodeURIComponent(trimmed)}`);
  }, [navigate]);

  const activeCount = query.trim() ? 1 + people.length : recentSearches.length + recentPeople.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setIsOpen(true);
      setSelectedIndex((prev) => (prev + 1 < activeCount ? prev + 1 : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : activeCount - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!query.trim()) {
        if (selectedIndex >= 0 && selectedIndex < recentSearches.length) executeFullSearch(recentSearches[selectedIndex]);
        else if (selectedIndex >= recentSearches.length && selectedIndex < activeCount) handleSelectPerson(recentPeople[selectedIndex - recentSearches.length]);
        return;
      }
      if (selectedIndex <= 0) executeFullSearch(query);
      else { const p = people[selectedIndex - 1]; if (p) handleSelectPerson(p); }
    }
  };

  const highlightMatches = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => (part.toLowerCase() === q.toLowerCase() ? <strong key={i} style={{ color: tokens.colorBrandForeground1 }}>{part}</strong> : part));
  };

  const getBadgeStatus = (userId: string, defaultStatus?: string) => {
    const current = getUserPresence(userId)?.status || defaultStatus;
    switch (current) {
      case 'AVAILABLE': return 'available';
      case 'BUSY': return 'busy';
      case 'DO_NOT_DISTURB': return 'do-not-disturb';
      case 'AWAY': case 'BE_RIGHT_BACK': return 'away';
      default: return 'offline';
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <Input
        ref={inputRef}
        className={styles.input}
        placeholder="Search (Ctrl+E)"
        contentBefore={<SearchRegular fontSize={18} />}
        appearance="filled-darker"
        size="medium"
        aria-label="Global search"
        aria-expanded={isOpen}
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(_, data) => { setQuery(data.value); setSelectedIndex(-1); setIsOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {query.trim() ? (
            <>
              <div
                role="option"
                aria-selected={selectedIndex === 0}
                className={`${styles.itemRow} ${selectedIndex === 0 ? styles.itemRowSelected : ''}`}
                onClick={() => executeFullSearch(query)}
              >
                <SearchRegular fontSize={18} style={{ color: tokens.colorBrandForeground1 }} />
                <div className={styles.itemText}>
                  <Body1 className={styles.title}>"{query}"</Body1>
                  <Caption1 className={styles.subtitle}>Press Enter to see all results</Caption1>
                </div>
              </div>
              {isLoading ? (
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
                  <Spinner size="tiny" label="Searching people..." />
                </div>
              ) : people.length > 0 ? (
                <>
                  <div className={styles.sectionTitle}>People</div>
                  {people.map((person, idx) => {
                    const isSelected = selectedIndex === idx + 1;
                    return (
                      <div
                        key={person.id} role="option" aria-selected={isSelected}
                        className={`${styles.itemRow} ${isSelected ? styles.itemRowSelected : ''}`}
                        onClick={() => handleSelectPerson(person)}
                      >
                        <Avatar
                          name={person.displayName}
                          image={person.avatarUrl ? { src: person.avatarUrl } : undefined}
                          initials={person.displayName.slice(0, 2).toUpperCase()}
                          badge={{ status: getBadgeStatus(person.id, person.presence?.status) }}
                          size={32}
                        />
                        <div className={styles.itemText}>
                          <Body1 className={styles.title}>{highlightMatches(person.displayName, query)}</Body1>
                          <Caption1 className={styles.subtitle}>{person.jobTitle || person.department || person.email}</Caption1>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : null}
            </>
          ) : (
            <>
              {recentSearches.length > 0 && (
                <>
                  <div className={styles.sectionTitle}>Recent Searches</div>
                  {recentSearches.map((term, idx) => (
                    <div
                      key={term} role="option" aria-selected={selectedIndex === idx}
                      className={`${styles.itemRow} ${selectedIndex === idx ? styles.itemRowSelected : ''}`}
                      onClick={() => executeFullSearch(term)}
                    >
                      <HistoryRegular fontSize={18} />
                      <div className={styles.itemText}><Body1 className={styles.title}>{term}</Body1></div>
                      <DismissRegular
                        fontSize={14} style={{ cursor: 'pointer', color: tokens.colorNeutralForeground3 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = recentSearches.filter((s) => s !== term);
                          setRecentSearches(updated);
                          localStorage.setItem('bcc_recent_searches', JSON.stringify(updated));
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
              {recentPeople.length > 0 && (
                <>
                  <div className={styles.sectionTitle}>Recent People</div>
                  {recentPeople.map((person, idx) => {
                    const isSelected = selectedIndex === recentSearches.length + idx;
                    return (
                      <div
                        key={person.id} role="option" aria-selected={isSelected}
                        className={`${styles.itemRow} ${isSelected ? styles.itemRowSelected : ''}`}
                        onClick={() => handleSelectPerson(person)}
                      >
                        <Avatar
                          name={person.displayName}
                          image={person.avatarUrl ? { src: person.avatarUrl } : undefined}
                          initials={person.displayName.slice(0, 2).toUpperCase()}
                          badge={{ status: getBadgeStatus(person.id, person.presence?.status) }}
                          size={32}
                        />
                        <div className={styles.itemText}>
                          <Body1 className={styles.title}>{person.displayName}</Body1>
                          <Caption1 className={styles.subtitle}>{person.jobTitle || person.email}</Caption1>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div className={styles.sectionTitle}>Suggested</div>
              <div className={styles.itemRow} style={{ opacity: 0.7 }}>
                <PersonAddRegular fontSize={20} />
                <div className={styles.itemText}><Body1 className={styles.title}>Invite people to BCC Teams</Body1></div>
                <Badge appearance="tint" color="brand">Coming soon</Badge>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
