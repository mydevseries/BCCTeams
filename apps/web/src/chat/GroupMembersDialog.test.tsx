import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupMembersDialog } from './GroupMembersDialog';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AuthProvider } from '../auth/AuthContext';
import { PresenceProvider } from '../presence/PresenceContext';
import { ChatProvider } from './ChatContext';

const mockGroupConv: any = {
  id: 'group-123',
  type: 'GROUP',
  title: 'Engineering Team',
  participants: [
    {
      id: 'p1',
      userId: 'user-1',
      role: 'ADMIN',
      user: { id: 'user-1', displayName: 'Current User', email: 'user1@bcc.test' },
    },
    {
      id: 'p2',
      userId: 'user-2',
      role: 'MEMBER',
      user: { id: 'user-2', displayName: 'Bob Colleague', email: 'bob@bcc.test' },
    },
  ],
  messages: [],
};

describe('GroupMembersDialog (C-002)', () => {
  beforeEach(() => {
    localStorage.setItem('bcc_access_token', 'mock-test-token');
    localStorage.setItem('bcc_user', JSON.stringify({ id: 'user-1', displayName: 'Current User' }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      )
    );
  });

  it('renders members list, roles, and leave button', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <GroupMembersDialog
                open={true}
                onOpenChange={vi.fn()}
                conversation={mockGroupConv}
              />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByText(/Group Members \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Current User/i)).toBeInTheDocument();
    expect(screen.getByText(/Group Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob Colleague/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add people/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /leave group/i })).toBeInTheDocument();
  });

  it('shows history sharing radio options when adding people', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <GroupMembersDialog
                open={true}
                onOpenChange={vi.fn()}
                conversation={mockGroupConv}
              />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /add people/i }));

    expect(screen.getByText("Don't include chat history")).toBeInTheDocument();
    expect(screen.getByText('Include all chat history')).toBeInTheDocument();
    expect(screen.getByText(/Include history from the past/i)).toBeInTheDocument();
  });
});

