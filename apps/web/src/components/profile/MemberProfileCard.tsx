import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  makeStyles,
  tokens,
  shorthands,
  Badge,
  Body1,
  Caption1,
  Divider,
} from '@fluentui/react-components';
import {
  ChatRegular,
  CallRegular,
  MailRegular,
  ClockRegular,
  BuildingRegular,
  BriefcaseRegular,
} from '@fluentui/react-icons';
import { MemberProfile } from '@bcc/shared';

const useStyles = makeStyles({
  surface: {
    maxWidth: '440px',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
    ...shorthands.gap(tokens.spacingVerticalS),
    textAlign: 'center',
  },
  badgeContainer: {
    marginTop: tokens.spacingVerticalXXS,
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    marginTop: tokens.spacingVerticalM,
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    color: tokens.colorNeutralForeground2,
    fontSize: '14px',
  },
  infoIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '18px',
  },
});

interface MemberProfileCardProps {
  member: MemberProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat?: (memberId: string) => void;
  onStartCall?: (memberId: string) => void;
}

export const MemberProfileCard: React.FC<MemberProfileCardProps> = ({
  member,
  open,
  onOpenChange,
  onStartChat,
  onStartCall,
}) => {
  const styles = useStyles();

  if (!member) return null;

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

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Member Profile</DialogTitle>

          <DialogContent>
            <div className={styles.header}>
              <Avatar
                name={member.displayName}
                image={member.avatarUrl ? { src: member.avatarUrl } : undefined}
                initials={getInitials(member.displayName)}
                badge={{ status: getPresenceStatus(member.presence?.status) }}
                size={72}
              />
              <Body1 block style={{ fontWeight: 'bold', fontSize: '18px' }}>
                {member.displayName}
              </Body1>
              {member.jobTitle && (
                <Caption1 block style={{ color: tokens.colorNeutralForeground2 }}>
                  {member.jobTitle}
                </Caption1>
              )}
              <div className={styles.badgeContainer}>
                <Badge
                  appearance="tint"
                  color={member.role === 'ADMIN' ? 'brand' : 'informative'}
                >
                  {member.role}
                </Badge>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className={styles.actionRow}>
              <Button
                appearance="primary"
                icon={<ChatRegular />}
                onClick={() => {
                  onStartChat?.(member.id);
                  onOpenChange(false);
                }}
              >
                Chat
              </Button>
              <Button
                appearance="secondary"
                icon={<CallRegular />}
                onClick={() => {
                  onStartCall?.(member.id);
                  onOpenChange(false);
                }}
              >
                Call
              </Button>
              <Button
                appearance="secondary"
                icon={<MailRegular />}
                onClick={() => {
                  window.location.href = `mailto:${member.email}`;
                }}
              >
                Email
              </Button>
            </div>

            <Divider />

            {/* Contact & Organization Details */}
            <div className={styles.section}>
              <div className={styles.infoItem}>
                <MailRegular className={styles.infoIcon} />
                <span>{member.email}</span>
              </div>

              {member.phoneNumber && (
                <div className={styles.infoItem}>
                  <CallRegular className={styles.infoIcon} />
                  <span>{member.phoneNumber}</span>
                </div>
              )}

              {member.department && (
                <div className={styles.infoItem}>
                  <BuildingRegular className={styles.infoIcon} />
                  <span>{member.department}</span>
                </div>
              )}

              {member.jobTitle && (
                <div className={styles.infoItem}>
                  <BriefcaseRegular className={styles.infoIcon} />
                  <span>{member.jobTitle}</span>
                </div>
              )}

              {member.localTime && (
                <div className={styles.infoItem}>
                  <ClockRegular className={styles.infoIcon} />
                  <span>{member.localTime} (Local time)</span>
                </div>
              )}
            </div>
          </DialogContent>

          <DialogActions>
            <Button appearance="subtle" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
