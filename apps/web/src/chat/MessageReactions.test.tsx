import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MessageReactionPicker, DEFAULT_QUICK_REACTIONS } from './MessageReactionPicker';
import { MessageReactionBadges } from './MessageReactionBadges';
import { MessageItem } from './MessageItem';
import { ChatMessage } from '@bcc/shared';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
};

describe('Message Reactions (C-007)', () => {
  describe('MessageReactionPicker', () => {
    it('renders default quick reactions and allows clicking one', () => {
      const onSelect = vi.fn();
      renderWithTheme(<MessageReactionPicker onSelectReaction={onSelect} />);

      // Verify all default quick reactions are rendered
      DEFAULT_QUICK_REACTIONS.forEach((item) => {
        expect(screen.getByRole('button', { name: `React with ${item.name}` })).toBeDefined();
      });

      // Click thumbs up
      const thumbsUpBtn = screen.getByRole('button', { name: 'React with Like' });
      fireEvent.click(thumbsUpBtn);
      expect(onSelect).toHaveBeenCalledWith('👍');
    });

    it('opens popover for additional emojis and filters via search', async () => {
      const onSelect = vi.fn();
      renderWithTheme(<MessageReactionPicker onSelectReaction={onSelect} />);

      // Click more reactions button
      const moreBtn = screen.getByRole('button', { name: 'More reactions' });
      fireEvent.click(moreBtn);

      // Search input should be visible
      const searchInput = screen.getByLabelText('Search reaction emoji');
      expect(searchInput).toBeDefined();

      // Search for "fire"
      fireEvent.change(searchInput, { target: { value: 'fire' } });

      const fireEmojiBtn = await screen.findByRole('button', { name: 'Fire' });
      expect(fireEmojiBtn).toBeDefined();
      fireEvent.click(fireEmojiBtn);

      expect(onSelect).toHaveBeenCalledWith('🔥');
    });
  });

  describe('MessageReactionBadges', () => {
    it('renders reaction badges with counts and handles toggle click', () => {
      const onToggle = vi.fn();
      const reactions = [
        {
          emoji: '👍',
          count: 2,
          users: [
            { id: 'u1', displayName: 'Alice' },
            { id: 'u2', displayName: 'Bob' },
          ],
          hasReacted: true,
        },
        {
          emoji: '❤️',
          count: 1,
          users: [{ id: 'u3', displayName: 'Carol' }],
          hasReacted: false,
        },
      ];

      renderWithTheme(
        <MessageReactionBadges reactions={reactions} onToggleReaction={onToggle} />
      );

      const thumbsBadge = screen.getByTestId('reaction-badge-👍');
      expect(thumbsBadge).toBeDefined();
      expect(thumbsBadge.textContent).toContain('👍');
      expect(thumbsBadge.textContent).toContain('2');

      const heartBadge = screen.getByTestId('reaction-badge-❤️');
      expect(heartBadge).toBeDefined();
      expect(heartBadge.textContent).toContain('❤️');
      expect(heartBadge.textContent).toContain('1');

      // Click thumbs badge to toggle
      fireEvent.click(thumbsBadge);
      expect(onToggle).toHaveBeenCalledWith('👍');
    });

    it('returns null if reactions list is empty', () => {
      const onToggle = vi.fn();
      const { container } = renderWithTheme(
        <MessageReactionBadges reactions={[]} onToggleReaction={onToggle} />
      );
      expect(container.querySelector('[role="group"]')).toBeNull();
    });
  });

  describe('MessageItem with Reactions', () => {
    const mockMessage: ChatMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-2',
      content: 'Hello with reactions!',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [
        {
          emoji: '🎉',
          count: 1,
          users: [{ id: 'user-1', displayName: 'Alice' }],
          hasReacted: true,
        },
      ],
    };

    it('renders message content, reaction bar, and reaction badges', () => {
      const onToggle = vi.fn();
      renderWithTheme(
        <MessageItem
          message={mockMessage}
          currentUserId="user-1"
          onToggleReaction={onToggle}
        />
      );

      expect(screen.getByText('Hello with reactions!')).toBeDefined();

      // Reaction badge should be present
      const partyBadge = screen.getByTestId('reaction-badge-🎉');
      expect(partyBadge).toBeDefined();
      expect(partyBadge.textContent).toContain('🎉');
      expect(partyBadge.textContent).toContain('1');

      // Floating reaction bar should be present in the message
      const reactionBar = screen.getByTestId('reaction-bar-msg-1');
      expect(reactionBar).toBeDefined();

      // Quick react directly from the bar
      const heartBtn = screen.getByRole('button', { name: 'React with Heart' });
      fireEvent.click(heartBtn);
      expect(onToggle).toHaveBeenCalledWith('msg-1', '❤️');
    });
  });
});

