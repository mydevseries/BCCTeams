import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatView } from '../views/ChatView';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AuthProvider } from '../auth/AuthContext';
import { PresenceProvider } from '../presence/PresenceContext';
import { ChatProvider } from './ChatContext';

describe('ChatView (C-001)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/chat/conversations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      })
    );
  });

  it('renders default empty state with New Chat button when no conversation selected', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <ChatView />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByText(/select a chat to start messaging/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
  });

  it('transitions to draft mode and opens recipient picker upon clicking New Chat', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <ChatView />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    const newChatBtn = screen.getByRole('button', { name: /new chat/i });
    fireEvent.click(newChatBtn);

    expect(screen.getByText('To:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type the name or email/i)).toBeInTheDocument();
    expect(screen.getByText(/new conversation/i)).toBeInTheDocument();
  });
});

