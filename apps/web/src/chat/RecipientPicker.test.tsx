import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipientPicker } from './RecipientPicker';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AuthProvider } from '../auth/AuthContext';
import { PresenceProvider } from '../presence/PresenceContext';
import { ChatProvider } from './ChatContext';

const mockColleagues = [
  {
    id: 'user-2',
    displayName: 'David Miller',
    email: 'david.miller@bcc.test',
    jobTitle: 'Frontend Architect',
    department: 'Engineering',
    role: 'MEMBER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('RecipientPicker (C-001)', () => {
  beforeEach(() => {
    localStorage.setItem('bcc_access_token', 'mock-test-token');
    localStorage.setItem('bcc_user', JSON.stringify({ id: 'user-1', displayName: 'Test User' }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/users?query=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockColleagues),
          });
        }
        if (url.includes('/api/chat/conversations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'user-1', displayName: 'Test User' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      })
    );
  });

  it('renders To label and search input', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <RecipientPicker />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByText('To:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type the name or email/i)).toBeInTheDocument();
  });

  it('autocompletes organizational users as the user types', async () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <ChatProvider>
              <RecipientPicker />
            </ChatProvider>
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    const input = screen.getByPlaceholderText(/type the name or email/i);
    fireEvent.change(input, { target: { value: 'David' } });

    await waitFor(() => {
      expect(screen.getByText('David Miller')).toBeInTheDocument();
      expect(screen.getByText('Frontend Architect')).toBeInTheDocument();
    });
  });
});
