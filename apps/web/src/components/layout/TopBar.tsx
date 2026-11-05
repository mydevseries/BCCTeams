import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Tooltip,
} from '@fluentui/react-components';
import {
  ArrowLeftRegular,
  ArrowRightRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { SearchBox } from './SearchBox';
import { AvatarMenu } from './AvatarMenu';
import { MemberProfile } from '@bcc/shared';

const useStyles = makeStyles({
  topBar: {
    display: 'flex',
    alignItems: 'center',
    height: '48px',
    minHeight: '48px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('0', tokens.spacingHorizontalM),
    ...shorthands.gap(tokens.spacingHorizontalM),
    userSelect: 'none',
    zIndex: 100,
    boxSizing: 'border-box',
    width: '100%',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    cursor: 'pointer',
    flexShrink: 0,
  },
  logoImg: {
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusSmall,
  },
  logoText: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    letterSpacing: '-0.2px',
  },
  navControls: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    flexShrink: 0,
  },
  searchContainer: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '640px',
    ...shorthands.margin('0', 'auto'),
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginLeft: 'auto',
    flexShrink: 0,
  },
});

interface TopBarProps {
  onOpenProfile: () => void;
  onOpenStatusMessage: () => void;
  onOpenSettings: () => void;
  onSelectMember?: (member: MemberProfile) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenProfile,
  onOpenStatusMessage,
  onOpenSettings,
  onSelectMember,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <header className={styles.topBar} role="banner">
      <div
        className={styles.logoContainer}
        onClick={() => navigate('/chat')}
        role="button"
        tabIndex={0}
        aria-label="BCC Teams Home"
      >
        <img
          src="/brand/favicon.svg"
          alt="BCC Teams Logo"
          className={styles.logoImg}
        />
        <span className={styles.logoText}>BCC Teams</span>
      </div>

      <div className={styles.navControls}>
        <Tooltip content="Back" relationship="label">
          <Button
            appearance="subtle"
            icon={<ArrowLeftRegular fontSize={18} />}
            size="small"
            onClick={() => window.history.back()}
            aria-label="Back"
          />
        </Tooltip>
        <Tooltip content="Forward" relationship="label">
          <Button
            appearance="subtle"
            icon={<ArrowRightRegular fontSize={18} />}
            size="small"
            onClick={() => window.history.forward()}
            aria-label="Forward"
          />
        </Tooltip>
      </div>

      <div className={styles.searchContainer}>
        <SearchBox onSelectMember={onSelectMember} />
      </div>

      <div className={styles.topBarRight}>
        <AvatarMenu
          onOpenProfile={onOpenProfile}
          onOpenStatusMessage={onOpenStatusMessage}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </header>
  );
};

