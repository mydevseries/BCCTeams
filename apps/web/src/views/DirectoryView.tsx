import React, { useState, useEffect, useTransition } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Title2,
  Body1,
  Caption1,
  Input,
  Button,
  Avatar,
  Badge,
  Spinner,
  Card,
  CardHeader,
} from '@fluentui/react-components';
import {
  SearchRegular,
  DismissRegular,
  BuildingRegular,
  MailRegular,
  CallRegular,
  ChatRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { MemberProfile } from '@bcc/shared';
import { useAuth } from '../auth/AuthContext';
import { MemberProfileCard } from '../components/profile/MemberProfileCard';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    overflowY: 'auto',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '480px',
    marginBottom: tokens.spacingVerticalL,
  },
  searchInput: {
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginBottom: tokens.spacingVerticalL,
  },
  memberCard: {
    cursor: 'pointer',
    ...shorthands.transition('all', '150ms', 'ease-in-out'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ':hover': {
      boxShadow: tokens.shadow8,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXS),
    marginTop: tokens.spacingVerticalS,
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  actionRow: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginTop: tokens.spacingVerticalM,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: 'auto',
    paddingTop: tokens.spacingVerticalL,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL, '0'),
    ...shorthands.gap(tokens.spacingVerticalM),
    color: tokens.colorNeutralForeground3,
  },
});

export const DirectoryView: React.FC = () => {
  const styles = useStyles();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [users, setUsers] = useState<MemberProfile[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [isMemberCardOpen, setIsMemberCardOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Debounce input typing (< 200ms) for snappy real-time responsiveness
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(searchQuery);
        setPage(1);
      });
    }, 150);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchDirectory = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (debouncedQuery.trim()) queryParams.set('query', debouncedQuery.trim());
        queryParams.set('page', page.toString());
        queryParams.set('limit', '12');

        const res = await fetch(`/api/users?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.total || 0);
        }
      } catch (err) {
        console.error('Failed to load organization directory:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      void fetchDirectory();
    }
  }, [token, debouncedQuery, page]);

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getPresenceStatus = (status?: string): 'available' | 'busy' | 'do-not-disturb' | 'away' | 'offline' => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return 'available';
      case 'BUSY':
        return 'busy';
      case 'DO_NOT_DISTURB':
        return 'do-not-disturb';
      case 'AWAY':
      case 'BE_RIGHT_BACK':
        return 'away';
      default:
        return 'offline';
    }
  };

  const handleMemberClick = (member: MemberProfile) => {
    setSelectedMember(member);
    setIsMemberCardOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title2 as="h1">Organization Directory</Title2>
          <Caption1 block style={{ color: tokens.colorNeutralForeground3 }}>
            Find colleagues across departments, view contact cards, and connect
          </Caption1>
        </div>
        <Badge appearance="tint" color="brand" size="large">
          {totalCount} {totalCount === 1 ? 'member' : 'members'}
        </Badge>
      </div>

      {/* Real-time search bar */}
      <div className={styles.searchContainer}>
        <Input
          className={styles.searchInput}
          size="large"
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
          contentBefore={<SearchRegular />}
          contentAfter={
            searchQuery ? (
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                size="small"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
              />
            ) : undefined
          }
          placeholder="Search by name, job title, department, or email..."
          aria-label="Search directory"
        />
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Spinner label="Loading directory..." size="large" />
        </div>
      ) : users.length === 0 ? (
        <div className={styles.emptyState}>
          <img
            src="/illustrations/empty-search.svg"
            alt="No users found"
            style={{ width: '120px', height: '120px' }}
          />
          <Body1 style={{ fontWeight: 'semibold' }}>No colleagues found</Body1>
          <Caption1>Try adjusting your search terms or department filter</Caption1>
        </div>
      ) : (
        <div className={styles.grid}>
          {users.map((member) => (
            <Card
              key={member.id}
              className={styles.memberCard}
              onClick={() => handleMemberClick(member)}
              role="button"
              tabIndex={0}
              aria-label={`Member: ${member.displayName}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleMemberClick(member);
                }
              }}
            >
              <CardHeader
                image={
                  <Avatar
                    name={member.displayName}
                    image={member.avatarUrl ? { src: member.avatarUrl } : undefined}
                    initials={getInitials(member.displayName)}
                    badge={{ status: getPresenceStatus(member.presence?.status) }}
                    size={48}
                  />
                }
                header={
                  <Body1 style={{ fontWeight: 'bold' }}>{member.displayName}</Body1>
                }
                description={
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    {member.jobTitle || 'Team Member'}
                  </Caption1>
                }
              />

              <div className={styles.cardContent}>
                {member.department && (
                  <div className={styles.infoRow}>
                    <BuildingRegular />
                    <span>{member.department}</span>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <MailRegular />
                  <span>{member.email}</span>
                </div>
                {member.phoneNumber && (
                  <div className={styles.infoRow}>
                    <CallRegular />
                    <span>{member.phoneNumber}</span>
                  </div>
                )}
              </div>

              <div className={styles.actionRow} onClick={(e) => e.stopPropagation()}>
                <Button
                  size="small"
                  appearance="secondary"
                  icon={<ChatRegular />}
                  onClick={() => navigate('/chat')}
                >
                  Chat
                </Button>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<MailRegular />}
                  onClick={() => {
                    window.location.href = `mailto:${member.email}`;
                  }}
                >
                  Email
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            appearance="subtle"
            icon={<ChevronLeftRegular />}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Caption1>
            Page {page} of {totalPages}
          </Caption1>
          <Button
            appearance="subtle"
            icon={<ChevronRightRegular />}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Contact Details Card Modal */}
      <MemberProfileCard
        member={selectedMember}
        open={isMemberCardOpen}
        onOpenChange={setIsMemberCardOpen}
        onStartChat={() => navigate('/chat')}
      />
    </div>
  );
};
