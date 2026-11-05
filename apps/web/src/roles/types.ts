import { UserRole } from '@bcc/shared';

export type { UserRole };

export interface RoleUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  phoneNumber: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface RoleSummary {
  totalUsers: number;
  admins: number;
  members: number;
  guests: number;
}

export interface PaginatedRoleUsers {
  users: RoleUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
