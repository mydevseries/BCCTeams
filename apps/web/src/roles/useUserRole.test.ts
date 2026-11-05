import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserRole } from './useUserRole';
import * as AuthContext from '../auth/AuthContext';

describe('useUserRole', () => {
  it('correctly calculates permissions for an ADMIN user', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@bcc.com',
        displayName: 'Alice Admin',
        role: 'ADMIN',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      token: 'valid-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    const { result } = renderHook(() => useUserRole());

    expect(result.current.role).toBe('ADMIN');
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isMember).toBe(false);
    expect(result.current.isGuest).toBe(false);
    expect(result.current.canBrowseDirectory).toBe(true);
    expect(result.current.canManageRoles).toBe(true);
    expect(result.current.canManageTeam(false)).toBe(true);
    expect(result.current.canDeleteChannel(false)).toBe(true);
    expect(result.current.canAccessChannel(false)).toBe(true);
  });

  it('correctly calculates permissions for a MEMBER user', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'member-1',
        email: 'member@bcc.com',
        displayName: 'Charlie Member',
        role: 'MEMBER',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      token: 'valid-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    const { result } = renderHook(() => useUserRole());

    expect(result.current.role).toBe('MEMBER');
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isMember).toBe(true);
    expect(result.current.isGuest).toBe(false);
    expect(result.current.canBrowseDirectory).toBe(true);
    expect(result.current.canManageRoles).toBe(false);
    // Standard members cannot manage team unless owner
    expect(result.current.canManageTeam(false)).toBe(false);
    expect(result.current.canManageTeam(true)).toBe(true);
    // Standard members cannot delete channels they do not own
    expect(result.current.canDeleteChannel(false)).toBe(false);
    expect(result.current.canDeleteChannel(true)).toBe(true);
    expect(result.current.canAccessChannel(false)).toBe(true);
  });

  it('correctly calculates permissions for a GUEST user', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'guest-1',
        email: 'guest@external.com',
        displayName: 'David Guest',
        role: 'GUEST',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      token: 'valid-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    const { result } = renderHook(() => useUserRole());

    expect(result.current.role).toBe('GUEST');
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isMember).toBe(false);
    expect(result.current.isGuest).toBe(true);
    // Guests cannot browse full org directories
    expect(result.current.canBrowseDirectory).toBe(false);
    expect(result.current.canManageRoles).toBe(false);
    // Guests can only access channels they are invited to
    expect(result.current.canAccessChannel(false)).toBe(false);
    expect(result.current.canAccessChannel(true)).toBe(true);
  });
});
