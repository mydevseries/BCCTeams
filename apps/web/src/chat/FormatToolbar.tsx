import React from 'react';
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  TextBoldRegular,
  TextItalicRegular,
  TextUnderlineRegular,
  TextStrikethroughRegular,
  TextHeader1Regular,
  TextHeader2Regular,
  TextHeader3Regular,
  TextQuoteRegular,
  TextBulletListLtrRegular,
  TextNumberListLtrRegular,
  CodeRegular,
  LinkRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  toolbar: {
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('2px', tokens.spacingHorizontalS),
    minHeight: '36px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.borderRadius(tokens.borderRadiusMedium, tokens.borderRadiusMedium, '0', '0'),
  },
  button: {
    minWidth: '28px',
    height: '28px',
    ...shorthands.padding('0', '4px'),
  },
});

export type FormatAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'bullet'
  | 'number'
  | 'inlineCode'
  | 'codeBlock'
  | 'link';

interface FormatToolbarProps {
  onApplyFormat: (action: FormatAction) => void;
  onOpenLinkDialog: () => void;
}

export const FormatToolbar: React.FC<FormatToolbarProps> = ({
  onApplyFormat,
  onOpenLinkDialog,
}) => {
  const styles = useStyles();

  return (
    <Toolbar className={styles.toolbar} aria-label="Rich text formatting toolbar" size="small">
      {/* Headings */}
      <Tooltip content="Heading 1" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextHeader1Regular fontSize={18} />}
          onClick={() => onApplyFormat('h1')}
          aria-label="Heading 1"
        />
      </Tooltip>
      <Tooltip content="Heading 2" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextHeader2Regular fontSize={18} />}
          onClick={() => onApplyFormat('h2')}
          aria-label="Heading 2"
        />
      </Tooltip>
      <Tooltip content="Heading 3" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextHeader3Regular fontSize={18} />}
          onClick={() => onApplyFormat('h3')}
          aria-label="Heading 3"
        />
      </Tooltip>

      <ToolbarDivider />

      {/* Inline styles */}
      <Tooltip content="Bold (Ctrl+B)" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextBoldRegular fontSize={18} />}
          onClick={() => onApplyFormat('bold')}
          aria-label="Bold"
        />
      </Tooltip>
      <Tooltip content="Italic (Ctrl+I)" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextItalicRegular fontSize={18} />}
          onClick={() => onApplyFormat('italic')}
          aria-label="Italic"
        />
      </Tooltip>
      <Tooltip content="Underline (Ctrl+U)" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextUnderlineRegular fontSize={18} />}
          onClick={() => onApplyFormat('underline')}
          aria-label="Underline"
        />
      </Tooltip>
      <Tooltip content="Strikethrough" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextStrikethroughRegular fontSize={18} />}
          onClick={() => onApplyFormat('strike')}
          aria-label="Strikethrough"
        />
      </Tooltip>

      <ToolbarDivider />

      {/* Quotes & Lists */}
      <Tooltip content="Quote" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextQuoteRegular fontSize={18} />}
          onClick={() => onApplyFormat('quote')}
          aria-label="Blockquote"
        />
      </Tooltip>
      <Tooltip content="Bulleted list" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextBulletListLtrRegular fontSize={18} />}
          onClick={() => onApplyFormat('bullet')}
          aria-label="Bulleted list"
        />
      </Tooltip>
      <Tooltip content="Numbered list" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<TextNumberListLtrRegular fontSize={18} />}
          onClick={() => onApplyFormat('number')}
          aria-label="Numbered list"
        />
      </Tooltip>

      <ToolbarDivider />

      {/* Code & Links */}
      <Tooltip content="Code snippet" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<CodeRegular fontSize={18} />}
          onClick={() => onApplyFormat('inlineCode')}
          aria-label="Inline code"
        />
      </Tooltip>
      <Tooltip content="Code block" relationship="label">
        <ToolbarButton
          className={styles.button}
          onClick={() => onApplyFormat('codeBlock')}
          aria-label="Code block"
        >
          {`{ }`}
        </ToolbarButton>
      </Tooltip>
      <Tooltip content="Insert link (Ctrl+K)" relationship="label">
        <ToolbarButton
          className={styles.button}
          icon={<LinkRegular fontSize={18} />}
          onClick={onOpenLinkDialog}
          aria-label="Insert link"
        />
      </Tooltip>
    </Toolbar>
  );
};
