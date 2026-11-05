import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import { PersonProhibitedRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalL),
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
    marginInline: 'auto',
  },
  iconWrapper: {
    fontSize: '48px',
    color: tokens.colorPaletteDarkOrangeForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  card: {
    width: '100%',
    marginTop: tokens.spacingVerticalM,
  },
});

interface GuestRestrictedBannerProps {
  featureName?: string;
}

export const GuestRestrictedBanner: React.FC<GuestRestrictedBannerProps> = ({
  featureName = 'Organization Directory',
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container} role="alert" aria-live="polite">
      <div className={styles.iconWrapper} aria-hidden="true">
        <PersonProhibitedRegular />
      </div>
      <MessageBar intent="warning" className={styles.card}>
        <MessageBarBody>
          <MessageBarTitle>Guest Access Restricted</MessageBarTitle>
          <Text block style={{ marginTop: '8px' }}>
            External guests cannot browse the full {featureName}. Your access is
            restricted to specific channels and direct messages you have been
            invited to.
          </Text>
        </MessageBarBody>
      </MessageBar>
    </div>
  );
};
