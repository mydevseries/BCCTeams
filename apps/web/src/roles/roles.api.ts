import { UserRole, RoleUser, RoleSummary, PaginatedRoleUsers } from './types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.message ||
      (res.status === 403
        ? 'Forbidden: Insufficient permissions for this action'
        : res.statusText || 'Request failed');
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status);
  }
  return res.json();
}

export const rolesApi = {
  async fetchRoleUsers(
    token: string,
    query?: string,
    roleFilter?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRoleUsers> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (roleFilter && roleFilter !== 'ALL') params.append('role', roleFilter);
    params.append('page', String(page));
    params.append('limit', String(limit));

    const res = await fetch(`${API_BASE}/roles/users?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<PaginatedRoleUsers>(res);
  },

  async fetchRoleSummary(token: string): Promise<RoleSummary> {
    const res = await fetch(`${API_BASE}/roles/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<RoleSummary>(res);
  },

  async updateUserRole(
    token: string,
    targetUserId: string,
    newRole: UserRole
  ): Promise<RoleUser> {
    const res = await fetch(`${API_BASE}/roles/users/${targetUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    });

    return handleResponse<RoleUser>(res);
  },

  async checkDirectoryAccess(
    token: string
  ): Promise<{ allowed: boolean; role: UserRole }> {
    const res = await fetch(`${API_BASE}/roles/directory-access`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<{ allowed: boolean; role: UserRole }>(res);
  },

  async checkPermission(
    token: string,
    action: string,
    context?: Record<string, any>
  ): Promise<{ allowed: boolean; action: string }> {
    const res = await fetch(`${API_BASE}/roles/check-permission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...context }),
    });

    return handleResponse<{ allowed: boolean; action: string }>(res);
  },
};
