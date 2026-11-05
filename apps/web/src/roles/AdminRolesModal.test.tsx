import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AdminRolesModal } from './AdminRolesModal';
import { rolesApi } from './roles.api';
import * as AuthContext from '../auth/AuthContext';

vi.mock('./roles.api', () => ({
  rolesApi: {
    fetchRoleUsers: vi.fn(),
    fetchRoleSummary: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

describe('AdminRolesModal', () => {
  const mockUsers = [
    {
      id: 'u1',
      email: 'alice@bcc.com',
      displayName: 'Alice Admin',
      avatarUrl: null,
      jobTitle: 'Lead',
      department: 'IT',
      phoneNumber: '111',
      role: 'ADMIN' as const,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'u2',
      email: 'bob@bcc.com',
      displayName: 'Bob Member',
      avatarUrl: null,
      jobTitle: 'Developer',
      department: 'Eng',
      phoneNumber: '222',
      role: 'MEMBER' as const,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const mockSummary = {
    totalUsers: 2,
    admins: 1,
    members: 1,
    guests: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u1',
        email: 'alice@bcc.com',
        displayName: 'Alice Admin',
        role: 'ADMIN',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      token: 'admin-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    vi.mocked(rolesApi.fetchRoleUsers).mockResolvedValue({
      users: mockUsers,
      total: 2,
      page: 1,
      limit: 50,
      totalPages: 1,
    });
    vi.mocked(rolesApi.fetchRoleSummary).mockResolvedValue(mockSummary);
  });

  const renderComponent = (open = true) =>
    render(
      <FluentProvider theme={webLightTheme}>
        <AdminRolesModal open={open} onOpenChange={vi.fn()} />
      </FluentProvider>
    );

  it('renders modal title, summary stats, and user list when open', async () => {
    renderComponent(true);

    expect(screen.getByText('Role & Permissions Management')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
      expect(screen.getByText('Total Members')).toBeInTheDocument();
    });
  });

  it('promotes standard member to admin via select dropdown', async () => {
    vi.mocked(rolesApi.updateUserRole).mockResolvedValue({
      ...mockUsers[1],
      role: 'ADMIN',
    });

    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    // First select is the role filter (combobox 0), second is Alice (1), third is Bob (2)
    const bobSelect = selects[2];

    fireEvent.change(bobSelect, { target: { value: 'ADMIN' } });

    await waitFor(() => {
      expect(rolesApi.updateUserRole).toHaveBeenCalledWith(
        'admin-token',
        'u2',
        'ADMIN'
      );
      expect(
        screen.getByText('Successfully updated Bob Member to ADMIN.')
      ).toBeInTheDocument();
    });
  });

  it('displays error message when trying to demote the last remaining active admin', async () => {
    vi.mocked(rolesApi.updateUserRole).mockRejectedValue(
      new Error('Cannot demote the last remaining active administrator')
    );

    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const aliceSelect = selects[1];

    fireEvent.change(aliceSelect, { target: { value: 'MEMBER' } });

    await waitFor(() => {
      expect(
        screen.getByText('Cannot demote the last remaining active administrator')
      ).toBeInTheDocument();
    });
  });
});
