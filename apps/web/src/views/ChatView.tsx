import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Title3,
  Body1,
  Caption1,
  Button,
} from '@fluentui/react-components';
import { SendRegular } from '@fluentui/react-icons';

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
  emptyImg: {
    width: '240px',
    height: '160px',
    marginBottom: tokens.spacingVerticalM,
  },
  composerArea: {
    height: '64px',
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('0', tokens.spacingHorizontalL),
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  mockInput: {
    flexGrow: 1,
    height: '38px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    alignItems: 'center',
    ...shorthands.padding('0', tokens.spacingHorizontalM),
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
});

export const ChatView: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title3>General Chat</Title3>
      </div>

      <div className={styles.content}>
        <img
          src="/illustrations/empty-chat.svg"
          alt="Start a conversation"
          className={styles.emptyImg}
        />
        <Title3>Welcome to BCC Teams Chat</Title3>
        <Body1 style={{ maxWidth: '420px', color: tokens.colorNeutralForeground2 }}>
          Send messages, share documents, start calls, and collaborate seamlessly
          with your team.
        </Body1>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Type a message below to start the conversation.
        </Caption1>
      </div>

      <div className={styles.composerArea}>
        <div className={styles.mockInput}>Type a new message...</div>
        <Button appearance="primary" icon={<SendRegular />}>
          Send
        </Button>
      </div>
    </div>
  );
};
