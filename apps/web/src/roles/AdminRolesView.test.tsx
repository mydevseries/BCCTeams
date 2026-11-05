import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AdminRolesView } from './AdminRolesView';
import { rolesApi } from './roles.api';
import * as AuthContext from '../auth/AuthContext';

vi.mock('./roles.api', () => ({
  rolesApi: {
    fetchRoleUsers: vi.fn(),
    fetchRoleSummary: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

describe('AdminRolesView', () => {
  const mockUsers = [
    {
      id: 'u1',
      email: 'admin@bcc.com',
      displayName: 'Alice Admin',
      avatarUrl: null,
      jobTitle: 'Admin',
      department: 'IT',
      phoneNumber: '111',
      role: 'ADMIN' as const,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'u2',
      email: 'member@bcc.com',
      displayName: 'Bob Member',
      avatarUrl: null,
      jobTitle: 'Dev',
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
  });

  it('renders Access Denied 403 screen when viewed by non-admin member', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u2',
        email: 'member@bcc.com',
        displayName: 'Bob Member',
        role: 'MEMBER',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      token: 'member-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <FluentProvider theme={webLightTheme}>
        <AdminRolesView />
      </FluentProvider>
    );

    expect(screen.getByText('Access Denied (HTTP 403 Forbidden)')).toBeInTheDocument();
    expect(
      screen.getByText(/Administrator privileges are required to view and manage organizational roles/)
    ).toBeInTheDocument();
  });

  it('renders Admin Management Center when viewed by an organization admin', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u1',
        email: 'admin@bcc.com',
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

    render(
      <FluentProvider theme={webLightTheme}>
        <AdminRolesView />
      </FluentProvider>
    );

    expect(screen.getByText('Admin Management Center — Roles')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
      expect(screen.getByText('Organization Admins')).toBeInTheDocument();
    });
  });
});
