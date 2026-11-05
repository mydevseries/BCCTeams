import React, { useState, useMemo } from 'react';
import {
  Popover,
  PopoverSurface,
  PopoverTrigger,
  TabList,
  Tab,
  Input,
  Button,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  EmojiRegular,
  GifRegular,
  StickerRegular,
  SearchRegular,
} from '@fluentui/react-icons';
import {
  EMOJI_CATEGORIES,
  CURATED_GIFS,
  BCC_STICKERS,
  EmojiItem,
} from './emojiData';

const useStyles = makeStyles({
  surface: {
    width: '340px',
    height: '380px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('8px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow16,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    paddingBottom: '8px',
  },
  searchBox: {
    width: '100%',
  },
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    marginTop: '8px',
    paddingRight: '4px',
  },
  categoryTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    ...shorthands.margin('8px', '0', '4px', '4px'),
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  emojiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  emojiButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    height: '36px',
    width: '36px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  quickPills: {
    display: 'flex',
    gap: '4px',
    overflowX: 'auto',
    paddingBottom: '4px',
    marginTop: '4px',
  },
  pillBtn: {
    fontSize: tokens.fontSizeBase100,
    height: '24px',
    padding: '0 8px',
  },
  gifGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  gifCard: {
    cursor: 'pointer',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
    transition: 'transform 0.15s ease',
    '&:hover': {
      transform: 'scale(1.02)',
      ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    },
  },
  gifImg: {
    width: '100%',
    height: '110px',
    objectFit: 'cover',
    display: 'block',
  },
  gifTitle: {
    fontSize: tokens.fontSizeBase100,
    ...shorthands.padding('4px'),
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  stickerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    padding: '4px',
  },
  stickerCard: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding('6px'),
    transition: 'transform 0.15s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  stickerImg: {
    width: '76px',
    height: '76px',
    objectFit: 'contain',
  },
  stickerLabel: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    marginTop: '4px',
    textAlign: 'center',
  },
});

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (title: string, url: string) => void;
  onSelectSticker: (name: string, svgDataUri: string) => void;
  disabled?: boolean;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  onSelectEmoji,
  onSelectGif,
  onSelectSticker,
  disabled = false,
}) => {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'emojis' | 'gifs' | 'stickers'>('emojis');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matches: EmojiItem[] = [];
    EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((e) => {
        if (e.name.toLowerCase().includes(q) || e.keywords.some((k) => k.includes(q))) {
          matches.push(e);
        }
      });
    });
    return matches;
  }, [searchQuery]);

  const filteredGifs = useMemo(() => {
    if (!searchQuery.trim()) return CURATED_GIFS;
    const q = searchQuery.toLowerCase();
    return CURATED_GIFS.filter(
      (g) => g.title.toLowerCase().includes(q) || g.tags.some((t) => t.includes(q))
    );
  }, [searchQuery]);

  const filteredStickers = useMemo(() => {
    if (!searchQuery.trim()) return BCC_STICKERS;
    const q = searchQuery.toLowerCase();
    return BCC_STICKERS.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <Popover open={open} onOpenChange={(_, data) => setOpen(data.open)} positioning="above-start">
      <PopoverTrigger disableButtonEnhancement>
        <Tooltip content="Emojis, GIFs, and stickers" relationship="label">
          <Button
            appearance="subtle"
            icon={<EmojiRegular fontSize={18} />}
            aria-label="Open emoji, GIF, and sticker picker"
            size="small"
            disabled={disabled}
          />
        </Tooltip>
      </PopoverTrigger>

      <PopoverSurface className={styles.surface} aria-label="Media picker">
        <div className={styles.header}>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => {
              setSelectedTab(data.value as 'emojis' | 'gifs' | 'stickers');
              setSearchQuery('');
            }}
            size="small"
          >
            <Tab value="emojis" icon={<EmojiRegular fontSize={16} />}>Emojis</Tab>
            <Tab value="gifs" icon={<GifRegular fontSize={16} />}>GIFs</Tab>
            <Tab value="stickers" icon={<StickerRegular fontSize={16} />}>Stickers</Tab>
          </TabList>

          <Input
            className={styles.searchBox}
            contentBefore={<SearchRegular fontSize={16} />}
            placeholder={
              selectedTab === 'emojis' ? 'Search emojis...' : selectedTab === 'gifs' ? 'Search GIFs...' : 'Search stickers...'
            }
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
            size="small"
            aria-label="Search picker items"
          />
        </div>

        <div className={styles.content}>
          {/* EMOJIS TAB */}
          {selectedTab === 'emojis' && (
            <div>
              {filteredEmojis ? (
                <div>
                  <div className={styles.categoryTitle}>Search Results ({filteredEmojis.length})</div>
                  <div className={styles.emojiGrid}>
                    {filteredEmojis.map((e) => (
                      <button
                        key={`${e.name}-${e.emoji}`}
                        className={styles.emojiButton}
                        onClick={() => {
                          onSelectEmoji(e.emoji);
                          setOpen(false);
                        }}
                        title={e.name}
                        aria-label={e.name}
                      >
                        {e.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <div className={styles.categoryTitle}>{cat.name}</div>
                    <div className={styles.emojiGrid}>
                      {cat.emojis.map((e) => (
                        <button
                          key={`${cat.id}-${e.name}-${e.emoji}`}
                          className={styles.emojiButton}
                          onClick={() => {
                            onSelectEmoji(e.emoji);
                            setOpen(false);
                          }}
                          title={e.name}
                          aria-label={e.name}
                        >
                          {e.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* GIFS TAB */}
          {selectedTab === 'gifs' && (
            <div>
              <div className={styles.quickPills}>
                {['Celebrate', 'Applause', 'Thumbs up', 'Coffee', 'Rocket', 'Teamwork'].map((pill) => (
                  <Button
                    key={pill}
                    appearance="outline"
                    size="small"
                    className={styles.pillBtn}
                    onClick={() => setSearchQuery(pill)}
                  >
                    {pill}
                  </Button>
                ))}
              </div>
              <div className={styles.gifGrid} style={{ marginTop: '8px' }}>
                {filteredGifs.map((gif) => (
                  <div
                    key={gif.id}
                    className={styles.gifCard}
                    onClick={() => {
                      onSelectGif(gif.title, gif.url);
                      setOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Send GIF: ${gif.title}`}
                  >
                    <img src={gif.previewUrl} alt={gif.title} className={styles.gifImg} loading="lazy" />
                    <div className={styles.gifTitle}>{gif.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STICKERS TAB */}
          {selectedTab === 'stickers' && (
            <div className={styles.stickerGrid}>
              {filteredStickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className={styles.stickerCard}
                  onClick={() => {
                    onSelectSticker(sticker.name, sticker.svgDataUri);
                    setOpen(false);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Send sticker: ${sticker.name}`}
                >
                  <img src={sticker.svgDataUri} alt={sticker.name} className={styles.stickerImg} />
                  <span className={styles.stickerLabel}>{sticker.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverSurface>
    </Popover>
  );
};

