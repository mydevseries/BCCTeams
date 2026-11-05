import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBox } from './SearchBox';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthContext';
import { PresenceProvider } from '../../presence/PresenceContext';

const mockUser = {
  id: 'user-1',
  email: 'test@bccteams.local',
  displayName: 'Current User',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockColleague = {
  id: 'user-2',
  email: 'carol@bccteams.local',
  displayName: 'Carol Danvers',
  jobTitle: 'Security Lead',
  department: 'Security',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const renderWithProviders = (ui: React.ReactElement, onSelectMember = vi.fn()) => {
  return render(
    <FluentProvider theme={webLightTheme}>
      <AuthProvider>
        <PresenceProvider>
          <MemoryRouter initialEntries={['/chat']}>
            {React.cloneElement(ui, { onSelectMember })}
          </MemoryRouter>
        </PresenceProvider>
      </AuthProvider>
    </FluentProvider>
  );
};

describe('SearchBox Component (A-010)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bcc_access_token', 'test-token');
    localStorage.setItem('bcc_user', JSON.stringify(mockUser));
    vi.restoreAllMocks();
  });

  it('renders global search input with placeholder and shortcut label', () => {
    renderWithProviders(<SearchBox />);
    const input = screen.getByLabelText(/Global search/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search (Ctrl+E)');
  });

  it('opens dropdown on focus showing suggested section when empty', async () => {
    renderWithProviders(<SearchBox />);
    const input = screen.getByLabelText(/Global search/i);
    fireEvent.focus(input);

    expect(await screen.findByText(/Invite people to BCC Teams/i)).toBeInTheDocument();
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
  });

  it('searches people, highlights matched query, and opens profile card on click', async () => {
    const onSelect = vi.fn();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUser,
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            users: [mockColleague],
            total: 1,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    renderWithProviders(<SearchBox />, onSelect);
    const input = screen.getByLabelText(/Global search/i);

    fireEvent.change(input, { target: { value: 'Carol' } });

    // Should see top row "Carol" — Press Enter to see all results
    expect(await screen.findByText(/"Carol"/i)).toBeInTheDocument();
    expect(screen.getByText(/Press Enter to see all results/i)).toBeInTheDocument();

    // Debounced fetch should display Carol Danvers
    await waitFor(() => {
      expect(screen.getByText(/Security Lead/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Danvers/i)).toBeInTheDocument();

    // Click person item
    const personRow = screen.getByText(/Security Lead/i).closest('[role="option"]');
    expect(personRow).toBeInTheDocument();
    fireEvent.click(personRow!);

    expect(onSelect).toHaveBeenCalledWith(mockColleague);
  });
});
