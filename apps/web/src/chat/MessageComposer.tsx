import React, { useState, useRef } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Tooltip,
} from '@fluentui/react-components';
import {
  SendRegular,
  TextFontRegular,
} from '@fluentui/react-icons';
import { useChat } from './ChatContext';
import { FormatToolbar, FormatAction } from './FormatToolbar';
import { InsertLinkDialog } from './InsertLinkDialog';

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
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    '&:focus-within': {
      ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    },
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
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
    minHeight: '28px',
    maxHeight: '180px',
    padding: '0',
    '&::placeholder': {
      color: tokens.colorNeutralForeground4,
    },
  },
  bottomActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('2px', tokens.spacingHorizontalM, tokens.spacingVerticalS),
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },
  sendButton: {
    color: tokens.colorBrandForeground1,
  },
  activeFormatBtn: {
    backgroundColor: tokens.colorNeutralBackground3,
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
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedTextForLink, setSelectedTextForLink] = useState('');

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

  const applyFormatting = (action: FormatAction) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end);

    let replacement = '';
    let newCursorPos = start;

    switch (action) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        newCursorPos = start + (selected ? replacement.length : 2);
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        newCursorPos = start + (selected ? replacement.length : 1);
        break;
      case 'underline':
        replacement = `<u>${selected || 'underlined text'}</u>`;
        newCursorPos = start + (selected ? replacement.length : 3);
        break;
      case 'strike':
        replacement = `~~${selected || 'strikethrough text'}~~`;
        newCursorPos = start + (selected ? replacement.length : 2);
        break;
      case 'h1':
        replacement = `\n# ${selected || 'Heading 1'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'h2':
        replacement = `\n## ${selected || 'Heading 2'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'h3':
        replacement = `\n### ${selected || 'Heading 3'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Quote'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'bullet':
        replacement = `\n- ${selected || 'List item'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'number':
        replacement = `\n1. ${selected || 'List item'}\n`;
        newCursorPos = start + replacement.length;
        break;
      case 'inlineCode':
        replacement = `\`${selected || 'code'}\``;
        newCursorPos = start + (selected ? replacement.length : 1);
        break;
      case 'codeBlock':
        replacement = `\n\`\`\`\n${selected || 'code here'}\n\`\`\`\n`;
        newCursorPos = start + replacement.length;
        break;
      default:
        return;
    }

    const nextText = text.slice(0, start) + replacement + text.slice(end);
    setText(nextText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleOpenLinkDialog = () => {
    const el = textareaRef.current;
    if (el) {
      const selected = text.slice(el.selectionStart, el.selectionEnd);
      setSelectedTextForLink(selected);
    }
    setIsLinkDialogOpen(true);
  };

  const handleInsertLink = (displayText: string, url: string) => {
    const el = textareaRef.current;
    const start = el ? el.selectionStart : text.length;
    const end = el ? el.selectionEnd : text.length;

    const markdownLink = `[${displayText}](${url})`;
    const nextText = text.slice(0, start) + markdownLink + text.slice(end);
    setText(nextText);

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(start + markdownLink.length, start + markdownLink.length);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyFormatting('bold');
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyFormatting('italic');
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        applyFormatting('underline');
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleOpenLinkDialog();
        return;
      }
    }

    // Enter behavior: if format toolbar is open, Enter adds a newline and Ctrl+Enter sends
    // If format toolbar is closed, Enter sends and Shift+Enter adds newline
    if (showFormatToolbar) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.composerBox}>
        {showFormatToolbar && (
          <FormatToolbar
            onApplyFormat={applyFormatting}
            onOpenLinkDialog={handleOpenLinkDialog}
          />
        )}

        <div className={styles.inputRow}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder={
              disabled
                ? 'Select a recipient to start messaging'
                : showFormatToolbar
                ? 'Type a message (Ctrl+Enter to send)...'
                : 'Type a new message...'
            }
            value={text}
            disabled={disabled}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={showFormatToolbar ? 3 : 1}
            aria-label="Message input"
          />
        </div>

        <div className={styles.bottomActions}>
          <div className={styles.actionGroup}>
            <Tooltip content="Format" relationship="label">
              <Button
                appearance="subtle"
                icon={<TextFontRegular fontSize={18} />}
                onClick={() => setShowFormatToolbar(!showFormatToolbar)}
                aria-label="Toggle rich text format"
                aria-pressed={showFormatToolbar}
                className={showFormatToolbar ? styles.activeFormatBtn : undefined}
                size="small"
                disabled={disabled}
              />
            </Tooltip>
          </div>

          <Tooltip
            content={showFormatToolbar ? 'Send (Ctrl+Enter)' : 'Send (Enter)'}
            relationship="label"
          >
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

      <InsertLinkDialog
        open={isLinkDialogOpen}
        initialText={selectedTextForLink}
        onDismiss={() => setIsLinkDialogOpen(false)}
        onInsert={handleInsertLink}
      />
    </div>
  );
};
