import React, { useState, useRef } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Tooltip,
} from '@fluentui/react-components';
import { SendRegular } from '@fluentui/react-icons';
import { useChat } from './ChatContext';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    flexShrink: 0,
  },
  composerBox: {
    display: 'flex',
    alignItems: 'flex-end',
    ...shorthands.gap(tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    '&:focus-within': {
      ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    },
  },
  textarea: {
    flexGrow: 1,
    border: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontFamily: 'inherit',
    lineHeight: '20px',
    resize: 'none',
    outline: 'none',
    minHeight: '24px',
    maxHeight: '120px',
    padding: '0',
    '&::placeholder': {
      color: tokens.colorNeutralForeground4,
    },
  },
  sendButton: {
    color: tokens.colorBrandForeground1,
  },
});

interface MessageComposerProps {
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ disabled = false }) => {
  const styles = useStyles();
  const { sendMessage, sendTyping } = useChat();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<any>(null);

  const handleTextChange = (val: string) => {
    setText(val);
    if (!disabled) {
      sendTyping(true);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        sendTyping(false);
      }, 3000);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || disabled) return;
    const content = text;
    setText('');
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    sendTyping(false);
    await sendMessage(content);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.composerBox}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={disabled ? 'Select a recipient to start messaging' : 'Type a new message...'}
          value={text}
          disabled={disabled}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Message input"
        />

        <Tooltip content="Send (Enter)" relationship="label">
          <Button
            appearance="subtle"
            icon={<SendRegular fontSize={20} />}
            disabled={disabled || !text.trim()}
            onClick={handleSend}
            aria-label="Send message"
            className={styles.sendButton}
            size="small"
          />
        </Tooltip>
      </div>
    </div>
  );
};

