import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { DirectoryRoleGuard } from './guards/directory-role.guard';
import { RolesService } from './roles.service';

describe('RolesGuards', () => {
  let rolesGuard: RolesGuard;
  let directoryGuard: DirectoryRoleGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let rolesService: { enforcePermission: jest.Mock };

  const createMockContext = (user?: any, params: any = {}, body: any = {}) => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          body,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    rolesService = {
      enforcePermission: jest.fn(),
    };
    rolesGuard = new RolesGuard(reflector as unknown as Reflector, rolesService as unknown as RolesService);
    directoryGuard = new DirectoryRoleGuard();
  });

  describe('RolesGuard', () => {
    it('grants access when no roles or permissions are required', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = createMockContext({ id: 'u1', role: 'MEMBER' });

      const result = await rolesGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('throws UnauthorizedException when no user is attached to request', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN']); // requiredRoles
      reflector.getAllAndOverride.mockReturnValueOnce(undefined); // requiredPermission
      const ctx = createMockContext(undefined);

      await expect(rolesGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('grants access when user has the required ADMIN role', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN']);
      reflector.getAllAndOverride.mockReturnValueOnce(undefined);
      const ctx = createMockContext({ id: 'admin-1', role: 'ADMIN' });

      const result = await rolesGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('throws 403 ForbiddenException when non-admin accesses admin resource', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN']);
      reflector.getAllAndOverride.mockReturnValueOnce(undefined);
      const ctx = createMockContext({ id: 'member-1', role: 'MEMBER' });

      await expect(rolesGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('throws 403 ForbiddenException when guest accesses member-only resource', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN', 'MEMBER']);
      reflector.getAllAndOverride.mockReturnValueOnce(undefined);
      const ctx = createMockContext({ id: 'guest-1', role: 'GUEST' });

      await expect(rolesGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('delegates to rolesService.enforcePermission when requiredPermission is present', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(undefined);
      reflector.getAllAndOverride.mockReturnValueOnce('DELETE_CHANNEL');
      rolesService.enforcePermission.mockResolvedValue(undefined);

      const ctx = createMockContext({ id: 'u1', role: 'MEMBER' }, { channelId: 'chan-1' });
      const result = await rolesGuard.canActivate(ctx);

      expect(result).toBe(true);
      expect(rolesService.enforcePermission).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          role: 'MEMBER',
          channelId: 'chan-1',
        }),
        'DELETE_CHANNEL'
      );
    });
  });

  describe('DirectoryRoleGuard', () => {
    it('allows ADMIN to access directory', () => {
      const ctx = createMockContext({ id: 'admin-1', role: 'ADMIN' });
      expect(directoryGuard.canActivate(ctx)).toBe(true);
    });

    it('allows MEMBER to access directory', () => {
      const ctx = createMockContext({ id: 'member-1', role: 'MEMBER' });
      expect(directoryGuard.canActivate(ctx)).toBe(true);
    });

    it('denies GUEST from accessing directory with descriptive 403 Forbidden', () => {
      const ctx = createMockContext({ id: 'guest-1', role: 'GUEST' });
      expect(() => directoryGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws UnauthorizedException if user is missing', () => {
      const ctx = createMockContext(undefined);
      expect(() => directoryGuard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });
});
