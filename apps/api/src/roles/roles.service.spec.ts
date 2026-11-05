import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUsers = [
    {
      id: 'admin-1',
      email: 'admin@bcc.com',
      displayName: 'Alice Admin',
      avatarUrl: null,
      jobTitle: 'System Admin',
      department: 'IT',
      phoneNumber: '123',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'admin-2',
      email: 'admin2@bcc.com',
      displayName: 'Bob Admin',
      avatarUrl: null,
      jobTitle: 'SecOps',
      department: 'IT',
      phoneNumber: '456',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'member-1',
      email: 'member@bcc.com',
      displayName: 'Charlie Member',
      avatarUrl: null,
      jobTitle: 'Developer',
      department: 'Engineering',
      phoneNumber: '789',
      role: 'MEMBER',
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'guest-1',
      email: 'guest@external.com',
      displayName: 'David Guest',
      avatarUrl: null,
      jobTitle: 'Contractor',
      department: 'External',
      phoneNumber: '000',
      role: 'GUEST',
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('getUsersWithRoles', () => {
    it('returns paginated users with roles and total count', async () => {
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(4);

      const result = await service.getUsersWithRoles('Alice', 'ADMIN', 1, 10);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'ADMIN',
          OR: [
            { displayName: { contains: 'Alice', mode: 'insensitive' } },
            { email: { contains: 'Alice', mode: 'insensitive' } },
            { department: { contains: 'Alice', mode: 'insensitive' } },
            { jobTitle: { contains: 'Alice', mode: 'insensitive' } },
          ],
        },
        select: expect.any(Object),
        orderBy: [{ role: 'asc' }, { displayName: 'asc' }],
        skip: 0,
        take: 10,
      });
      expect(result.total).toBe(4);
      expect(result.users).toHaveLength(4);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getUserRole', () => {
    it('returns the role of an existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
      const role = await service.getUserRole('admin-1');
      expect(role).toBe('ADMIN');
    });

    it('throws NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserRole('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRoleSummary', () => {
    it('returns counts of total, admins, members, and guests', async () => {
      prisma.user.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(2)  // admins
        .mockResolvedValueOnce(6)  // members
        .mockResolvedValueOnce(2); // guests

      const summary = await service.getRoleSummary();

      expect(summary).toEqual({
        totalUsers: 10,
        admins: 2,
        members: 6,
        guests: 2,
      });
    });
  });

  describe('updateUserRole', () => {
    it('promotes a standard member to admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'member-1',
        role: 'MEMBER',
        isActive: true,
      });
      prisma.user.update.mockResolvedValue({
        ...mockUsers[2],
        role: 'ADMIN',
      });

      const result = await service.updateUserRole('admin-1', 'member-1', 'ADMIN');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: { role: 'ADMIN' },
        select: expect.any(Object),
      });
      expect(result.role).toBe('ADMIN');
    });

    it('demotes an admin to member when multiple admins exist', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-2',
        role: 'ADMIN',
        isActive: true,
      });
      prisma.user.count.mockResolvedValue(2); // 2 active admins exist
      prisma.user.update.mockResolvedValue({
        ...mockUsers[1],
        role: 'MEMBER',
      });

      const result = await service.updateUserRole('admin-1', 'admin-2', 'MEMBER');

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: 'ADMIN', isActive: true },
      });
      expect(result.role).toBe('MEMBER');
    });

    it('throws BadRequestException when attempting to demote the last remaining active admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        isActive: true,
      });
      prisma.user.count.mockResolvedValue(1); // Only 1 active admin!

      await expect(
        service.updateUserRole('admin-1', 'admin-1', 'MEMBER')
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if target user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserRole('admin-1', 'non-existent', 'ADMIN')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkPermission and enforcePermission', () => {
    it('allows ADMIN to manage roles and view admin center', async () => {
      const allowed = await service.checkPermission(
        { userId: 'admin-1', role: 'ADMIN' },
        'MANAGE_ROLES'
      );
      expect(allowed).toBe(true);
      await expect(
        service.enforcePermission({ userId: 'admin-1', role: 'ADMIN' }, 'MANAGE_ROLES')
      ).resolves.not.toThrow();
    });

    it('denies MEMBER from managing roles with 403 Forbidden', async () => {
      const allowed = await service.checkPermission(
        { userId: 'member-1', role: 'MEMBER' },
        'MANAGE_ROLES'
      );
      expect(allowed).toBe(false);
      await expect(
        service.enforcePermission({ userId: 'member-1', role: 'MEMBER' }, 'MANAGE_ROLES')
      ).rejects.toThrow(ForbiddenException);
    });

    it('restricts GUEST from browsing full organization directory with 403 Forbidden', async () => {
      const allowed = await service.checkPermission(
        { userId: 'guest-1', role: 'GUEST' },
        'BROWSE_DIRECTORY'
      );
      expect(allowed).toBe(false);
      await expect(
        service.enforcePermission({ userId: 'guest-1', role: 'GUEST' }, 'BROWSE_DIRECTORY')
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows MEMBER and ADMIN to browse organization directory', async () => {
      expect(
        await service.checkPermission({ userId: 'member-1', role: 'MEMBER' }, 'BROWSE_DIRECTORY')
      ).toBe(true);
      expect(
        await service.checkPermission({ userId: 'admin-1', role: 'ADMIN' }, 'BROWSE_DIRECTORY')
      ).toBe(true);
    });

    it('allows team OWNER to add members, remove members, and promote to co-owners', async () => {
      const context = {
        userId: 'member-1',
        role: 'MEMBER' as const,
        teamId: 'team-1',
        teamRole: 'OWNER' as const,
      };
      expect(await service.checkPermission(context, 'ADD_MEMBER')).toBe(true);
      expect(await service.checkPermission(context, 'REMOVE_MEMBER')).toBe(true);
      expect(await service.checkPermission(context, 'PROMOTE_CO_OWNER')).toBe(true);
    });

    it('denies non-owner team MEMBER from adding or removing team members with 403 Forbidden', async () => {
      const context = {
        userId: 'member-1',
        role: 'MEMBER' as const,
        teamId: 'team-1',
        teamRole: 'MEMBER' as const,
      };
      expect(await service.checkPermission(context, 'ADD_MEMBER')).toBe(false);
      await expect(service.enforcePermission(context, 'ADD_MEMBER')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('prevents standard members from deleting channels they do not own with 403 Forbidden', async () => {
      const context = {
        userId: 'member-1',
        role: 'MEMBER' as const,
        channelId: 'chan-1',
        isChannelOwner: false,
      };
      expect(await service.checkPermission(context, 'DELETE_CHANNEL')).toBe(false);
      await expect(service.enforcePermission(context, 'DELETE_CHANNEL')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('allows channel owner to delete channel', async () => {
      const context = {
        userId: 'member-1',
        role: 'MEMBER' as const,
        channelId: 'chan-1',
        isChannelOwner: true,
      };
      expect(await service.checkPermission(context, 'DELETE_CHANNEL')).toBe(true);
    });

    it('restricts GUEST from accessing channels unless explicitly invited', async () => {
      const notInvited = {
        userId: 'guest-1',
        role: 'GUEST' as const,
        channelId: 'chan-1',
        isChannelMember: false,
      };
      expect(await service.checkPermission(notInvited, 'ACCESS_CHANNEL')).toBe(false);
      await expect(service.enforcePermission(notInvited, 'ACCESS_CHANNEL')).rejects.toThrow(
        ForbiddenException
      );

      const invited = {
        userId: 'guest-1',
        role: 'GUEST' as const,
        channelId: 'chan-1',
        isChannelMember: true,
      };
      expect(await service.checkPermission(invited, 'ACCESS_CHANNEL')).toBe(true);
    });
  });
});
