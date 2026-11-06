import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { RichTextRenderer } from './RichTextRenderer';

describe('Emoji, GIFs, and Stickers (C-006)', () => {
  it('opens emoji picker, allows search, and triggers onSelectEmoji', async () => {
    const handleEmoji = vi.fn();
    const handleGif = vi.fn();
    const handleSticker = vi.fn();

    render(
      <FluentProvider theme={webLightTheme}>
        <EmojiPickerPopover
          onSelectEmoji={handleEmoji}
          onSelectGif={handleGif}
          onSelectSticker={handleSticker}
        />
      </FluentProvider>
    );

    const triggerBtn = screen.getByRole('button', { name: /open emoji, gif, and sticker picker/i });
    expect(triggerBtn).toBeInTheDocument();
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /emojis/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /gifs/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /stickers/i })).toBeInTheDocument();
    });

    // Verify search input
    const searchInput = screen.getByLabelText(/search picker items/i);
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'rocket' } });

    // Rocket emoji button
    const rocketBtn = screen.getByRole('button', { name: 'Rocket' });
    expect(rocketBtn).toBeInTheDocument();
    fireEvent.click(rocketBtn);

    expect(handleEmoji).toHaveBeenCalledWith('🚀');
  });

  it('switches to GIFs tab, lists animated GIFs, and selects GIF', async () => {
    const handleEmoji = vi.fn();
    const handleGif = vi.fn();
    const handleSticker = vi.fn();

    render(
      <FluentProvider theme={webLightTheme}>
        <EmojiPickerPopover
          onSelectEmoji={handleEmoji}
          onSelectGif={handleGif}
          onSelectSticker={handleSticker}
        />
      </FluentProvider>
    );

    const triggerBtn = screen.getByRole('button', { name: /open emoji, gif, and sticker picker/i });
    fireEvent.click(triggerBtn);

    const gifsTab = screen.getByRole('tab', { name: /gifs/i });
    fireEvent.click(gifsTab);

    await waitFor(() => {
      expect(screen.getByText('Celebration Confetti')).toBeInTheDocument();
    });

    const gifCard = screen.getByRole('button', { name: /send gif: celebration confetti/i });
    fireEvent.click(gifCard);

    expect(handleGif).toHaveBeenCalledWith(
      'Celebration Confetti',
      expect.stringContaining('unsplash.com')
    );
  });

  it('switches to Stickers tab, displays BCC stickers, and selects sticker', async () => {
    const handleEmoji = vi.fn();
    const handleGif = vi.fn();
    const handleSticker = vi.fn();

    render(
      <FluentProvider theme={webLightTheme}>
        <EmojiPickerPopover
          onSelectEmoji={handleEmoji}
          onSelectGif={handleGif}
          onSelectSticker={handleSticker}
        />
      </FluentProvider>
    );

    const triggerBtn = screen.getByRole('button', { name: /open emoji, gif, and sticker picker/i });
    fireEvent.click(triggerBtn);

    const stickersTab = screen.getByRole('tab', { name: /stickers/i });
    fireEvent.click(stickersTab);

    await waitFor(() => {
      expect(screen.getByText('Great Job!')).toBeInTheDocument();
    });

    const stickerCard = screen.getByRole('button', { name: /send sticker: great job!/i });
    fireEvent.click(stickerCard);

    expect(handleSticker).toHaveBeenCalledWith(
      'Great Job!',
      expect.stringContaining('data:image/svg+xml')
    );
  });

  it('renders GIF and Sticker images in RichTextRenderer', () => {
    const content = 'Check out this GIF: ![Celebration](https://example.com/dance.gif) and sticker: ![Sticker](data:image/svg+xml;utf8,<svg></svg>)';
    render(
      <FluentProvider theme={webLightTheme}>
        <RichTextRenderer content={content} />
      </FluentProvider>
    );

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/dance.gif');
    expect(images[1]).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
  });
});
