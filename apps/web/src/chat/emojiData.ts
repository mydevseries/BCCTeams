export interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
}

export interface EmojiCategory {
  id: string;
  name: string;
  emojis: EmojiItem[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    emojis: [
      { emoji: '😀', name: 'Grinning Face', keywords: ['smile', 'happy', 'grin'] },
      { emoji: '😃', name: 'Smiling Face with Big Eyes', keywords: ['happy', 'joy', 'smile'] },
      { emoji: '😄', name: 'Smiling Face with Smiling Eyes', keywords: ['happy', 'laugh', 'pleased'] },
      { emoji: '😁', name: 'Beaming Face with Smiling Eyes', keywords: ['grin', 'smile', 'happy'] },
      { emoji: '😆', name: 'Grinning Squinting Face', keywords: ['laugh', 'lol', 'haha'] },
      { emoji: '😅', name: 'Grinning Face with Sweat', keywords: ['relieved', 'nervous', 'whew'] },
      { emoji: '🤣', name: 'Rolling on the Floor Laughing', keywords: ['rofl', 'hilarious', 'lol'] },
      { emoji: '😂', name: 'Face with Tears of Joy', keywords: ['tears', 'crying', 'laugh'] },
      { emoji: '🙂', name: 'Slightly Smiling Face', keywords: ['smile', 'okay'] },
      { emoji: '😉', name: 'Winking Face', keywords: ['wink', 'flirt', 'joke'] },
      { emoji: '😊', name: 'Smiling Face with Blushing Eyes', keywords: ['blush', 'warm', 'proud'] },
      { emoji: '😇', name: 'Smiling Face with Halo', keywords: ['angel', 'innocent'] },
      { emoji: '🥰', name: 'Smiling Face with Hearts', keywords: ['love', 'adore', 'fond'] },
      { emoji: '😍', name: 'Heart Eyes', keywords: ['love', 'crush', 'heart'] },
      { emoji: '🤩', name: 'Star-Struck', keywords: ['excited', 'amazed', 'wow'] },
      { emoji: '😎', name: 'Smiling Face with Sunglasses', keywords: ['cool', 'chill'] },
      { emoji: '🥳', name: 'Partying Face', keywords: ['celebrate', 'party', 'birthday'] },
      { emoji: '🤔', name: 'Thinking Face', keywords: ['hmm', 'think', 'ponder'] },
      { emoji: '🤫', name: 'Shushing Face', keywords: ['quiet', 'secret', 'shh'] },
      { emoji: '🤗', name: 'Hugging Face', keywords: ['hug', 'warm', 'embrace'] },
      { emoji: '👍', name: 'Thumbs Up', keywords: ['yes', 'approve', 'like', 'good'] },
      { emoji: '👏', name: 'Clapping Hands', keywords: ['applause', 'bravo', 'congrats'] },
      { emoji: '🙌', name: 'Raising Hands', keywords: ['hooray', 'celebration', 'praise'] },
      { emoji: '🎉', name: 'Party Popper', keywords: ['tada', 'celebration', 'party'] },
      { emoji: '❤️', name: 'Red Heart', keywords: ['love', 'heart', 'care'] },
      { emoji: '🔥', name: 'Fire', keywords: ['lit', 'hot', 'amazing'] },
      { emoji: '🚀', name: 'Rocket', keywords: ['launch', 'fast', 'growth'] },
      { emoji: '⭐', name: 'Star', keywords: ['favorite', 'star', 'stellar'] },
      { emoji: '💡', name: 'Light Bulb', keywords: ['idea', 'tip', 'insight'] },
      { emoji: '✅', name: 'Checkmark Button', keywords: ['done', 'complete', 'approved'] },
    ],
  },
  {
    id: 'people',
    name: 'People & Gestures',
    emojis: [
      { emoji: '👋', name: 'Waving Hand', keywords: ['hello', 'bye', 'wave'] },
      { emoji: '🤝', name: 'Handshake', keywords: ['deal', 'agree', 'partner'] },
      { emoji: '✌️', name: 'Peace Sign', keywords: ['peace', 'victory'] },
      { emoji: '🤞', name: 'Crossed Fingers', keywords: ['luck', 'hopeful'] },
      { emoji: '💪', name: 'Flexed Biceps', keywords: ['strong', 'power', 'muscle'] },
      { emoji: '🙏', name: 'Folded Hands', keywords: ['please', 'thank you', 'pray'] },
      { emoji: '👀', name: 'Eyes', keywords: ['looking', 'see', 'peek'] },
      { emoji: '🙋‍♂️', name: 'Man Raising Hand', keywords: ['question', 'volunteer'] },
      { emoji: '🙋‍♀️', name: 'Woman Raising Hand', keywords: ['question', 'volunteer'] },
      { emoji: '🧑‍💻', name: 'Technologist', keywords: ['coder', 'developer', 'software'] },
    ],
  },
  {
    id: 'workplace',
    name: 'Office & Work',
    emojis: [
      { emoji: '☕', name: 'Hot Beverage', keywords: ['coffee', 'tea', 'break'] },
      { emoji: '💻', name: 'Laptop', keywords: ['computer', 'work', 'code'] },
      { emoji: '📊', name: 'Bar Chart', keywords: ['metrics', 'data', 'stats'] },
      { emoji: '📈', name: 'Chart Increasing', keywords: ['growth', 'up', 'progress'] },
      { emoji: '📅', name: 'Calendar', keywords: ['schedule', 'meeting', 'date'] },
      { emoji: '📁', name: 'File Folder', keywords: ['documents', 'files'] },
      { emoji: '🎯', name: 'Direct Hit', keywords: ['goal', 'target', 'objective'] },
      { emoji: '🏆', name: 'Trophy', keywords: ['winner', 'champion', 'first'] },
      { emoji: '✨', name: 'Sparkles', keywords: ['shine', 'magic', 'clean', 'new'] },
      { emoji: '💯', name: 'Hundred Points', keywords: ['perfect', 'hundred', 'score'] },
    ],
  },
];

export interface GifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  tags: string[];
}

export const CURATED_GIFS: GifItem[] = [
  {
    id: 'gif-celebrate',
    title: 'Celebration Confetti',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=240&auto=format&fit=crop&q=80',
    tags: ['celebrate', 'party', 'confetti', 'cheer', 'tada'],
  },
  {
    id: 'gif-applause',
    title: 'Standing Ovation Applause',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=480&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=240&auto=format&fit=crop&q=80',
    tags: ['applause', 'clapping', 'cheer', 'bravo', 'congrats'],
  },
  {
    id: 'gif-thumbs-up',
    title: 'Thumbs Up Approval',
    url: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=480&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=240&auto=format&fit=crop&q=80',
    tags: ['thumbs up', 'yes', 'agree', 'great', 'good'],
  },
  {
    id: 'gif-coffee',
    title: 'Morning Coffee',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=480&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=240&auto=format&fit=crop&q=80',
    tags: ['coffee', 'morning', 'break', 'energy', 'work'],
  },
  {
    id: 'gif-rocket',
    title: 'Rocket Launch',
    url: 'https://images.unsplash.com/photo-1517976487507-5b3b4b45a0d2?w=480&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1517976487507-5b3b4b45a0d2?w=240&auto=format&fit=crop&q=80',
    tags: ['rocket', 'launch', 'release', 'deploy', 'fast'],
  },
  {
    id: 'gif-teamwork',
    title: 'Team High Five',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=480&auto=format&fit=crop&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=240&auto=format&fit=crop&q=80',
    tags: ['teamwork', 'high five', 'team', 'collaboration', 'together'],
  },
];

export interface StickerItem {
  id: string;
  name: string;
  category: string;
  svgDataUri: string;
}

// Generate creative high-resolution SVG stickers in BCC brand colors
const createStickerSvg = (title: string, subtitle: string, iconSymbol: string, bgHue: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHue}" />
        <stop offset="100%" stop-color="#4F1D6E" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.25"/>
      </filter>
    </defs>
    <rect x="15" y="15" width="170" height="170" rx="36" fill="url(#grad)" filter="url(#shadow)" stroke="#FFFFFF" stroke-width="3"/>
    <text x="100" y="90" font-size="54" text-anchor="middle" dominant-baseline="middle">${iconSymbol}</text>
    <text x="100" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="bold" font-size="16" fill="#FFFFFF" text-anchor="middle">${title}</text>
    <text x="100" y="154" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#E6D3F2" text-anchor="middle">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const BCC_STICKERS: StickerItem[] = [
  {
    id: 'sticker-great-job',
    name: 'Great Job!',
    category: 'Celebration',
    svgDataUri: createStickerSvg('GREAT JOB!', 'BCC Teams Kudos', '🌟', '#7A3E9D'),
  },
  {
    id: 'sticker-high-five',
    name: 'High Five!',
    category: 'Teamwork',
    svgDataUri: createStickerSvg('HIGH FIVE!', 'Awesome work', '✋', '#0E7C86'),
  },
  {
    id: 'sticker-rocket',
    name: 'To the Moon',
    category: 'Milestone',
    svgDataUri: createStickerSvg('SHIPPED!', 'On time release', '🚀', '#9B4FC5'),
  },
  {
    id: 'sticker-coffee',
    name: 'Coffee Power',
    category: 'Office',
    svgDataUri: createStickerSvg('COFFEE TIME', 'Recharge & conquer', '☕', '#7A3E9D'),
  },
  {
    id: 'sticker-mind-blown',
    name: 'Mind Blown',
    category: 'Reaction',
    svgDataUri: createStickerSvg('BRILLIANT!', 'Genius solution', '🤯', '#BF6DE8'),
  },
  {
    id: 'sticker-approved',
    name: '100% Approved',
    category: 'Status',
    svgDataUri: createStickerSvg('APPROVED', 'LGTM Ready to go', '✅', '#007A5A'),
  },
];

