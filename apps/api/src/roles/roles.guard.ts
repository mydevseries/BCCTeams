import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@bcc/shared';
import { ROLES_KEY, PERMISSION_ACTION_KEY } from './roles.decorator';
import { RolesService } from './roles.service';
import { PermissionAction, PermissionContext } from './permissions.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    const requiredPermission = this.reflector.getAllAndOverride<PermissionAction>(
      PERMISSION_ACTION_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If neither roles nor permissions are specified, grant access
    if (!requiredRoles && !requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check Role enum whitelist
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.role as UserRole);
      if (!hasRole) {
        if (requiredRoles.includes('ADMIN') && user.role !== 'ADMIN') {
          throw new ForbiddenException(
            'Forbidden: Administrator privileges are required to access this resource'
          );
        }
        if (user.role === 'GUEST') {
          throw new ForbiddenException(
            'Forbidden: Guests are not permitted to perform this action'
          );
        }
        throw new ForbiddenException(
          'Forbidden: Insufficient permissions for this action'
        );
      }
    }

    // Check dynamic permission action if defined
    if (requiredPermission) {
      const permContext: PermissionContext = {
        userId: user.id,
        role: user.role as UserRole,
        teamId: request.params?.teamId || request.body?.teamId,
        channelId: request.params?.channelId || request.body?.channelId,
        teamRole: request.userTeamRole,
        isChannelOwner: request.isChannelOwner,
        isChannelMember: request.isChannelMember,
      };

      await this.rolesService.enforcePermission(permContext, requiredPermission);
    }

    return true;
  }
}
