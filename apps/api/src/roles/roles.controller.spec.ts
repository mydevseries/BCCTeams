import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Reflector } from '@nestjs/core';

describe('RolesController', () => {
  let controller: RolesController;
  let service: {
    getUsersWithRoles: jest.Mock;
    getRoleSummary: jest.Mock;
    getUserRole: jest.Mock;
    updateUserRole: jest.Mock;
    enforcePermission: jest.Mock;
  };

  const mockReq = {
    user: {
      id: 'admin-1',
      email: 'admin@bcc.com',
      role: 'ADMIN' as const,
    },
  };

  beforeEach(async () => {
    service = {
      getUsersWithRoles: jest.fn(),
      getRoleSummary: jest.fn(),
      getUserRole: jest.fn(),
      updateUserRole: jest.fn(),
      enforcePermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        { provide: RolesService, useValue: service },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
  });

  describe('getUsersWithRoles', () => {
    it('delegates to service with query parameters', async () => {
      const mockResult = { users: [], total: 0, page: 1, limit: 20, totalPages: 1 };
      service.getUsersWithRoles.mockResolvedValue(mockResult);

      const result = await controller.getUsersWithRoles({ query: 'test', role: 'ADMIN', page: 1, limit: 10 });
      expect(service.getUsersWithRoles).toHaveBeenCalledWith('test', 'ADMIN', 1, 10);
      expect(result).toBe(mockResult);
    });
  });

  describe('getRoleSummary', () => {
    it('returns role summary from service', async () => {
      const mockSummary = { totalUsers: 5, admins: 1, members: 3, guests: 1 };
      service.getRoleSummary.mockResolvedValue(mockSummary);

      const result = await controller.getRoleSummary();
      expect(service.getRoleSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getUserRole', () => {
    it('returns the role for a specific user', async () => {
      service.getUserRole.mockResolvedValue('MEMBER');

      const result = await controller.getUserRole('u2');
      expect(service.getUserRole).toHaveBeenCalledWith('u2');
      expect(result).toEqual({ userId: 'u2', role: 'MEMBER' });
    });
  });

  describe('updateUserRole', () => {
    it('promotes/demotes user via service', async () => {
      const mockUpdated = { id: 'u2', role: 'ADMIN' };
      service.updateUserRole.mockResolvedValue(mockUpdated);

      const result = await controller.updateUserRole(mockReq as any, 'u2', { role: 'ADMIN' });
      expect(service.updateUserRole).toHaveBeenCalledWith('admin-1', 'u2', 'ADMIN');
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('checkDirectoryAccess', () => {
    it('returns allowed: true with user role', async () => {
      const result = await controller.checkDirectoryAccess(mockReq as any);
      expect(result).toEqual({ allowed: true, role: 'ADMIN' });
    });
  });

  describe('checkPermission', () => {
    it('enforces permission and returns success status', async () => {
      service.enforcePermission.mockResolvedValue(undefined);

      const result = await controller.checkPermission(mockReq as any, { action: 'DELETE_CHANNEL', channelId: 'c1' });
      expect(service.enforcePermission).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          role: 'ADMIN',
          channelId: 'c1',
        }),
        'DELETE_CHANNEL'
      );
      expect(result).toEqual({ allowed: true, action: 'DELETE_CHANNEL' });
    });
  });
});
