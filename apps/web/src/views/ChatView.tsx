import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
} from '@fluentui/react-components';
import { ComposeRegular } from '@fluentui/react-icons';
import { useChat } from '../chat/ChatContext';
import { ChatHeader } from '../chat/ChatHeader';
import { RecipientPicker } from '../chat/RecipientPicker';
import { MessageList } from '../chat/MessageList';
import { MessageComposer } from '../chat/MessageComposer';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  emptyCenter: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalL),
    textAlign: 'center',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  emptyImg: {
    width: '200px',
    height: '140px',
    marginBottom: tokens.spacingVerticalM,
  },
  emptyTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  emptySubtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    maxWidth: '440px',
    lineHeight: '22px',
  },
});

export const ChatView: React.FC = () => {
  const styles = useStyles();
  const {
    activeConversation,
    activeRecipient,
    messages,
    isDraft,
    startDraftChat,
  } = useChat();

  return (
    <div className={styles.root}>
      {isDraft ? (
        <>
          <RecipientPicker />
          {activeRecipient ? (
            <>
              <MessageList
                messages={messages}
                recipient={activeRecipient}
                isDraft={true}
              />
              <MessageComposer disabled={false} />
            </>
          ) : (
            <>
              <div className={styles.emptyCenter}>
                <span className={styles.emptyTitle}>New conversation</span>
                <span className={styles.emptySubtitle}>
                  Search for a colleague above to start a 1:1 direct chat
                </span>
              </div>
              <MessageComposer disabled={true} />
            </>
          )}
        </>
      ) : activeConversation && activeConversation.otherParticipant ? (
        <>
          <ChatHeader participant={activeConversation.otherParticipant} />
          <MessageList
            messages={messages}
            recipient={activeConversation.otherParticipant}
            isDraft={false}
          />
          <MessageComposer disabled={false} />
        </>
      ) : (
        <div className={styles.emptyCenter}>
          <img
            src="/illustrations/empty-chat.svg"
            alt="No conversation selected"
            className={styles.emptyImg}
          />
          <span className={styles.emptyTitle}>Select a chat to start messaging</span>
          <span className={styles.emptySubtitle}>
            Choose a colleague from your conversations list on the left, or click below to start a new 1:1 chat.
          </span>
          <Button
            appearance="primary"
            icon={<ComposeRegular />}
            onClick={() => startDraftChat()}
            size="medium"
          >
            New Chat
          </Button>
        </div>
      )}
    </div>
  );
};
