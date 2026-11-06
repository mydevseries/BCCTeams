import React, { useState } from 'react';
import {
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Button,
  Tooltip,
  Input,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { EmojiRegular, SearchRegular } from '@fluentui/react-icons';
import { EMOJI_CATEGORIES, EmojiItem } from './emojiData';

const useStyles = makeStyles({
  reactionBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    boxShadow: tokens.shadow8,
    ...shorthands.padding('2px', '4px'),
    ...shorthands.gap('2px'),
  },
  quickBtn: {
    minWidth: '28px',
    height: '28px',
    padding: '0 4px',
    fontSize: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      transform: 'scale(1.2)',
    },
  },
  moreBtn: {
    minWidth: '26px',
    height: '26px',
    padding: 0,
  },
  popoverSurface: {
    width: '280px',
    maxHeight: '300px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('8px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16,
  },
  popoverGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '4px',
    overflowY: 'auto',
    maxHeight: '220px',
    marginTop: '6px',
    paddingRight: '4px',
  },
  gridEmojiBtn: {
    fontSize: '18px',
    height: '32px',
    width: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
});

export const DEFAULT_QUICK_REACTIONS = [
  { emoji: '👍', name: 'Like' },
  { emoji: '❤️', name: 'Heart' },
  { emoji: '😂', name: 'Laugh' },
  { emoji: '😮', name: 'Surprised' },
  { emoji: '😢', name: 'Sad' },
  { emoji: '😡', name: 'Angry' },
];

interface MessageReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
}

export const MessageReactionPicker: React.FC<MessageReactionPickerProps> = ({
  onSelectReaction,
}) => {
  const styles = useStyles();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allEmojis = React.useMemo(() => {
    const list: EmojiItem[] = [];
    EMOJI_CATEGORIES.forEach((cat) => list.push(...cat.emojis));
    return list;
  }, []);

  const filteredEmojis = React.useMemo(() => {
    if (!searchQuery.trim()) return allEmojis;
    const q = searchQuery.toLowerCase();
    return allEmojis.filter(
      (e) => e.name.toLowerCase().includes(q) || e.keywords.some((k) => k.includes(q))
    );
  }, [allEmojis, searchQuery]);

  return (
    <div className={styles.reactionBar} role="toolbar" aria-label="Reactions bar">
      {DEFAULT_QUICK_REACTIONS.map((item) => (
        <Tooltip key={item.name} content={item.name} relationship="label">
          <button
            className={styles.quickBtn}
            onClick={() => onSelectReaction(item.emoji)}
            aria-label={`React with ${item.name}`}
          >
            {item.emoji}
          </button>
        </Tooltip>
      ))}

      <Popover
        open={popoverOpen}
        onOpenChange={(_, data) => setPopoverOpen(data.open)}
        positioning="above-end"
      >
        <PopoverTrigger disableButtonEnhancement>
          <Tooltip content="More reactions" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              className={styles.moreBtn}
              icon={<EmojiRegular fontSize={16} />}
              aria-label="More reactions"
            />
          </Tooltip>
        </PopoverTrigger>

        <PopoverSurface className={styles.popoverSurface} aria-label="All reactions">
          <Input
            size="small"
            contentBefore={<SearchRegular fontSize={14} />}
            placeholder="Search emoji..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
            aria-label="Search reaction emoji"
          />
          <div className={styles.popoverGrid}>
            {filteredEmojis.map((e) => (
              <button
                key={`${e.name}-${e.emoji}`}
                className={styles.gridEmojiBtn}
                onClick={() => {
                  onSelectReaction(e.emoji);
                  setPopoverOpen(false);
                }}
                title={e.name}
                aria-label={e.name}
              >
                {e.emoji}
              </button>
            ))}
          </div>
        </PopoverSurface>
      </Popover>
    </div>
  );
};

