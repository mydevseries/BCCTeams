import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Title3,
  Body1,
  Button,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  header: {
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.padding('0', tokens.spacingHorizontalL),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL),
    textAlign: 'center',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  img: {
    width: '240px',
    height: '160px',
  },
});

interface GenericSectionViewProps {
  title: string;
  description: string;
  illustration: string;
  actionText?: string;
  onAction?: () => void;
}

export const GenericSectionView: React.FC<GenericSectionViewProps> = ({
  title,
  description,
  illustration,
  actionText,
  onAction,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title3>{title}</Title3>
      </div>
      <div className={styles.content}>
        <img src={illustration} alt={title} className={styles.img} />
        <Title3>{title}</Title3>
        <Body1 style={{ maxWidth: '420px', color: tokens.colorNeutralForeground2 }}>
          {description}
        </Body1>
        {actionText && (
          <Button appearance="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
};
