import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatList } from './ChatList';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AuthProvider } from '../auth/AuthContext';
import { PresenceProvider } from '../presence/PresenceContext';
import { ChatProvider } from './ChatContext';

const mockConversations = [
  {
    id: 'conv-pinned',
    type: 'DIRECT',
    isPinned: true,
    isMuted: false,
    unreadCount: 0,
    participants: [
      { id: 'p1', userId: 'user-1', role: 'MEMBER', user: { id: 'user-1', displayName: 'Current User' } },
      { id: 'p2', userId: 'user-2', role: 'MEMBER', user: { id: 'user-2', displayName: 'Alice Pinned' } },
    ],
    otherParticipant: { id: 'user-2', displayName: 'Alice Pinned', email: 'alice@bcc.test' },
    lastMessage: { id: 'm1', content: 'Pinned hello', createdAt: new Date().toISOString() },
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conv-unread',
    type: 'GROUP',
    title: 'Marketing Project',
    isPinned: false,
    isMuted: true,
    unreadCount: 4,
    participants: [
      { id: 'p1', userId: 'user-1', role: 'ADMIN', user: { id: 'user-1', displayName: 'Current User' } },
      { id: 'p3', userId: 'user-3', role: 'MEMBER', user: { id: 'user-3', displayName: 'Bob Marketing' } },
    ],
    lastMessage: { id: 'm2', content: 'Unread announcement', createdAt: new Date().toISOString() },
    updatedAt: new Date().toISOString(),
  },
];

describe('ChatList (C-003)', () => {
  beforeEach(() => {
    localStorage.setItem('bcc_access_token', 'mock-token');
    localStorage.setItem('bcc_user', JSON.stringify({ id: 'user-1', displayName: 'Current User' }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'user-1', displayName: 'Current User', email: 'user1@bcc.test' }),
          });
        }
        if (url.includes('/api/chat/conversations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockConversations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      })
    );
  });

  it('renders Pinned and Recent sections with unread badges and mute indicators', async () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <ChatList filter="all" />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    // Wait for conversations to load
    expect(await screen.findByText(/PINNED \(1\)/i)).toBeInTheDocument();
    expect(await screen.findByText('Alice Pinned')).toBeInTheDocument();
    expect(await screen.findByText('Marketing Project')).toBeInTheDocument();

    // Verify unread badge count
    expect(screen.getByText('4')).toBeInTheDocument();

    // Verify mute indicator
    expect(screen.getByLabelText('Muted')).toBeInTheDocument();

    // Verify pinned indicator
    expect(screen.getByLabelText('Pinned')).toBeInTheDocument();
  });

  it('renders options menu with Pin/Unpin, Mute/Unmute, Mark as unread, and Hide', async () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <ChatList filter="all" />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    const optionsBtn = await screen.findByLabelText(/options for alice pinned/i);
    fireEvent.click(optionsBtn);

    expect(await screen.findByText('Unpin')).toBeInTheDocument();
    expect(screen.getByText('Mute')).toBeInTheDocument();
    expect(screen.getByText('Mark as unread')).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });
});
