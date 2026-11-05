import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@bcc/shared';
import {
  PermissionAction,
  PermissionContext,
  IPermissionsService,
} from './permissions.interface';

export interface RoleUserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  phoneNumber: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedRoleUsers {
  users: RoleUserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RoleSummary {
  totalUsers: number;
  admins: number;
  members: number;
  guests: number;
}

@Injectable()
export class RolesService implements IPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersWithRoles(
    query?: string,
    roleFilter?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRoleUsers> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (roleFilter && roleFilter !== 'ALL') {
      where.role = roleFilter;
    }

    if (query && query.trim().length > 0) {
      const q = query.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { jobTitle: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          jobTitle: true,
          department: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ role: 'asc' }, { displayName: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users as RoleUserResponse[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getUserRole(userId: string): Promise<UserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.role as UserRole;
  }

  async getRoleSummary(): Promise<RoleSummary> {
    const [totalUsers, admins, members, guests] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN', isActive: true } }),
      this.prisma.user.count({ where: { role: 'MEMBER', isActive: true } }),
      this.prisma.user.count({ where: { role: 'GUEST', isActive: true } }),
    ]);

    return {
      totalUsers,
      admins,
      members,
      guests,
    };
  }

  async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole
  ): Promise<RoleUserResponse> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, isActive: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`Target user with ID ${targetUserId} not found`);
    }

    // Protection rule: Cannot demote the last remaining active administrator
    if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (activeAdminCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last remaining active administrator'
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated as RoleUserResponse;
  }

  async checkPermission(
    context: PermissionContext,
    action: PermissionAction
  ): Promise<boolean> {
    const { role } = context;

    // Org-level Admin checks
    if (action === 'MANAGE_ROLES' || action === 'VIEW_ADMIN_CENTER' || action === 'MANAGE_SETTINGS') {
      return role === 'ADMIN';
    }

    // Directory restrictions: Guests cannot browse the full org directory
    if (action === 'BROWSE_DIRECTORY') {
      return role !== 'GUEST';
    }

    // Team Actions: Team owners can add new members, promote to co-owners, and remove members
    if (
      action === 'ADD_MEMBER' ||
      action === 'REMOVE_MEMBER' ||
      action === 'PROMOTE_CO_OWNER' ||
      action === 'MANAGE_TEAM' ||
      action === 'DELETE_TEAM'
    ) {
      if (role === 'ADMIN') return true;
      return context.teamRole === 'OWNER';
    }

    // Channel Deletion: Standard members cannot delete channels they do not own
    if (action === 'DELETE_CHANNEL') {
      if (role === 'ADMIN') return true;
      if (context.teamRole === 'OWNER') return true;
      return context.isChannelOwner === true;
    }

    // Guest channel access: Guests are restricted to specific channels they are invited to
    if (action === 'ACCESS_CHANNEL') {
      if (role === 'GUEST') {
        return context.isChannelMember === true;
      }
      return true;
    }

    return true;
  }

  async enforcePermission(
    context: PermissionContext,
    action: PermissionAction
  ): Promise<void> {
    const allowed = await this.checkPermission(context, action);

    if (!allowed) {
      if (action === 'BROWSE_DIRECTORY') {
        throw new ForbiddenException(
          'Forbidden: Guests are not permitted to browse the organization directory'
        );
      }
      if (action === 'MANAGE_ROLES' || action === 'VIEW_ADMIN_CENTER') {
        throw new ForbiddenException(
          'Forbidden: Administrator privileges are required for this action'
        );
      }
      if (action === 'DELETE_CHANNEL') {
        throw new ForbiddenException(
          'Forbidden: Standard members cannot delete channels they do not own'
        );
      }
      if (
        action === 'ADD_MEMBER' ||
        action === 'REMOVE_MEMBER' ||
        action === 'PROMOTE_CO_OWNER'
      ) {
        throw new ForbiddenException(
          'Forbidden: Only team owners can manage team membership and ownership'
        );
      }
      if (action === 'ACCESS_CHANNEL') {
        throw new ForbiddenException(
          'Forbidden: Guests can only access channels they are explicitly invited to'
        );
      }
      throw new ForbiddenException(
        'Forbidden: Insufficient permissions for this action'
      );
    }
  }
}
