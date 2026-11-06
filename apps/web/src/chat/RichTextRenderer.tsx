import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Tooltip,
} from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    wordBreak: 'break-word',
    fontSize: tokens.fontSizeBase300,
    lineHeight: '20px',
  },
  heading1: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '24px',
    marginTop: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalXXS,
  },
  heading2: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '22px',
    marginTop: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalXXS,
  },
  heading3: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '20px',
    marginTop: tokens.spacingVerticalXXS,
    marginBottom: tokens.spacingVerticalXXS,
  },
  blockquote: {
    ...shorthands.borderLeft('3px', 'solid', tokens.colorBrandStroke1),
    ...shorthands.padding(tokens.spacingVerticalXXS, tokens.spacingHorizontalM),
    ...shorthands.margin('4px', '0'),
    color: tokens.colorNeutralForeground2,
    fontStyle: 'italic',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius('0', tokens.borderRadiusSmall, tokens.borderRadiusSmall, '0'),
  },
  list: {
    ...shorthands.margin('2px', '0'),
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  codeBlock: {
    backgroundColor: tokens.colorNeutralBackgroundAlpha2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.margin('4px', '0'),
    overflowX: 'auto',
    position: 'relative',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: tokens.fontSizeBase200,
  },
  codeBlockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('2px', tokens.spacingHorizontalS),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  codeBlockPre: {
    margin: 0,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    whiteSpace: 'pre',
    overflowX: 'auto',
  },
  inlineCode: {
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ...shorthands.padding('1px', '4px'),
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: tokens.fontSizeBase200,
  },
  link: {
    color: tokens.colorBrandForegroundLink,
    textDecorationLine: 'underline',
    '&:hover': {
      color: tokens.colorBrandForegroundLinkHover,
    },
  },
  paragraph: {
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  bold: {
    fontWeight: tokens.fontWeightBold,
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  image: {
    maxWidth: '280px',
    maxHeight: '220px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    objectFit: 'contain',
    display: 'block',
    ...shorthands.margin('4px', '0'),
  },
});

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlockComponent: React.FC<CodeBlockProps> = ({ code, language }) => {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.codeBlock} role="region" aria-label="Code snippet">
      <div className={styles.codeBlockHeader}>
        <span>{language || 'code'}</span>
        <Tooltip content={copied ? 'Copied' : 'Copy code'} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={copied ? <CheckmarkRegular fontSize={14} /> : <CopyRegular fontSize={14} />}
            onClick={handleCopy}
            aria-label="Copy code"
          />
        </Tooltip>
      </div>
      <pre className={styles.codeBlockPre}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Parse inline text containing bold, italic, underline, strikethrough, inline code, and links
export const renderInlineFormattedText = (text: string, styles: ReturnType<typeof useStyles>): React.ReactNode[] => {
  if (!text) return [];

  // Match images: ![alt](url)
  // Match links: [text](url)
  // Inline code: `code`
  // Bold: **text**
  // Underline: <u>text</u>
  // Strikethrough: ~~text~~
  // Italic: *text* or _text_
  const tokenRegex = /(!\[(.*?)\]\((https?:\/\/[^\s)]+|data:image\/[^\s)]+)\)|\[(.*?)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*(.*?)\*\*|<u>(.*?)<\/u>|~~(.*?)~~|\*([^*]+)\*|_([^_]+)_)/g;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }

    const [
      fullMatch,
      ,
      imgAlt,
      imgUrl,
      linkText,
      linkUrl,
      inlineCode,
      boldText,
      underlineText,
      strikeText,
      italicAsterisk,
      italicUnderscore,
    ] = match;

    if (imgAlt !== undefined && imgUrl !== undefined) {
      result.push(
        <img
          key={`img-${keyIdx++}`}
          src={imgUrl}
          alt={imgAlt || 'image'}
          className={styles.image}
          loading="lazy"
        />
      );
    } else if (linkText !== undefined && linkUrl !== undefined) {
      result.push(
        <a
          key={`link-${keyIdx++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {linkText || linkUrl}
        </a>
      );
    } else if (inlineCode !== undefined) {
      result.push(
        <code key={`code-${keyIdx++}`} className={styles.inlineCode}>
          {inlineCode}
        </code>
      );
    } else if (boldText !== undefined) {
      result.push(
        <strong key={`bold-${keyIdx++}`} className={styles.bold}>
          {renderInlineFormattedText(boldText, styles)}
        </strong>
      );
    } else if (underlineText !== undefined) {
      result.push(
        <span key={`u-${keyIdx++}`} className={styles.underline}>
          {renderInlineFormattedText(underlineText, styles)}
        </span>
      );
    } else if (strikeText !== undefined) {
      result.push(
        <span key={`strike-${keyIdx++}`} className={styles.strikethrough}>
          {renderInlineFormattedText(strikeText, styles)}
        </span>
      );
    } else if (italicAsterisk !== undefined || italicUnderscore !== undefined) {
      const itText = italicAsterisk !== undefined ? italicAsterisk : italicUnderscore;
      result.push(
        <em key={`it-${keyIdx++}`} className={styles.italic}>
          {renderInlineFormattedText(itText, styles)}
        </em>
      );
    } else {
      result.push(fullMatch);
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
};

interface RichTextRendererProps {
  content: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
  const styles = useStyles();

  if (!content) return null;

  // Split into fenced code blocks and regular segments
  const fencedRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: Array<{ type: 'code' | 'text'; code?: string; lang?: string; text?: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fencedRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        text: content.substring(lastIndex, match.index),
      });
    }
    blocks.push({
      type: 'code',
      lang: match[1]?.trim() || undefined,
      code: match[2]?.replace(/\r?\n$/, '') || '',
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'text',
      text: content.substring(lastIndex),
    });
  }

  return (
    <div className={styles.container}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'code' && block.code !== undefined) {
          return <CodeBlockComponent key={`cb-${bIdx}`} code={block.code} language={block.lang} />;
        }

        const rawText = block.text || '';
        const lines = rawText.split(/\r?\n/);
        const elements: React.ReactNode[] = [];
        let inBulletList = false;
        let bulletItems: React.ReactNode[] = [];
        let inNumberList = false;
        let numberItems: React.ReactNode[] = [];

        const flushLists = (keyPrefix: string) => {
          if (inBulletList) {
            elements.push(
              <ul key={`${keyPrefix}-ul`} className={styles.list}>
                {bulletItems}
              </ul>
            );
            inBulletList = false;
            bulletItems = [];
          }
          if (inNumberList) {
            elements.push(
              <ol key={`${keyPrefix}-ol`} className={styles.list}>
                {numberItems}
              </ol>
            );
            inNumberList = false;
            numberItems = [];
          }
        };

        lines.forEach((line, lIdx) => {
          const lKey = `b${bIdx}-l${lIdx}`;

          // Headings: #, ##, ###
          const h1Match = line.match(/^#\s+(.+)$/);
          if (h1Match) {
            flushLists(lKey);
            elements.push(
              <div key={lKey} className={styles.heading1}>
                {renderInlineFormattedText(h1Match[1], styles)}
              </div>
            );
            return;
          }

          const h2Match = line.match(/^##\s+(.+)$/);
          if (h2Match) {
            flushLists(lKey);
            elements.push(
              <div key={lKey} className={styles.heading2}>
                {renderInlineFormattedText(h2Match[1], styles)}
              </div>
            );
            return;
          }

          const h3Match = line.match(/^###\s+(.+)$/);
          if (h3Match) {
            flushLists(lKey);
            elements.push(
              <div key={lKey} className={styles.heading3}>
                {renderInlineFormattedText(h3Match[1], styles)}
              </div>
            );
            return;
          }

          // Blockquote: > text
          const quoteMatch = line.match(/^>\s*(.+)$/);
          if (quoteMatch) {
            flushLists(lKey);
            elements.push(
              <blockquote key={lKey} className={styles.blockquote}>
                {renderInlineFormattedText(quoteMatch[1], styles)}
              </blockquote>
            );
            return;
          }

          // Bullet list: - or *
          const bulletMatch = line.match(/^[-*]\s+(.+)$/);
          if (bulletMatch) {
            if (inNumberList) flushLists(lKey);
            inBulletList = true;
            bulletItems.push(
              <li key={`li-${lIdx}`}>{renderInlineFormattedText(bulletMatch[1], styles)}</li>
            );
            return;
          }

          // Numbered list: 1. text
          const numberMatch = line.match(/^\d+\.\s+(.+)$/);
          if (numberMatch) {
            if (inBulletList) flushLists(lKey);
            inNumberList = true;
            numberItems.push(
              <li key={`nli-${lIdx}`}>{renderInlineFormattedText(numberMatch[1], styles)}</li>
            );
            return;
          }

          // Normal line
          flushLists(lKey);
          if (line.trim() === '') {
            elements.push(<div key={lKey} style={{ height: '6px' }} />);
          } else {
            elements.push(
              <p key={lKey} className={styles.paragraph}>
                {renderInlineFormattedText(line, styles)}
              </p>
            );
          }
        });

        flushLists(`b${bIdx}-end`);

        return <React.Fragment key={`textblock-${bIdx}`}>{elements}</React.Fragment>;
      })}
    </div>
  );
};
