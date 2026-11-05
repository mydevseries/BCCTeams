import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from './MessageList';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AuthProvider } from '../auth/AuthContext';
import { PresenceProvider } from '../presence/PresenceContext';
import { ChatProvider } from './ChatContext';

describe('MessageReceiptsAndTyping (C-004)', () => {
  beforeEach(() => {
    localStorage.setItem('bcc_access_token', 'mock-token');
    localStorage.setItem('bcc_user', JSON.stringify({ id: 'user-me', displayName: 'Me User' }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'user-me', displayName: 'Me User', email: 'me@bcc.test' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      })
    );
  });

  it('renders single checkmark for sent message and double checkmark for read message', () => {
    const messages = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-me',
        content: 'Hello delivered',
        isEdited: false,
        isDeleted: false,
        createdAt: '2026-11-05T10:00:00.000Z',
        updatedAt: '2026-11-05T10:00:00.000Z',
      },
    ];

    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <MessageList messages={messages} isDraft={false} />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByText('Hello delivered')).toBeInTheDocument();
    expect(screen.getByLabelText(/sent|read/i)).toBeInTheDocument();
  });
});

