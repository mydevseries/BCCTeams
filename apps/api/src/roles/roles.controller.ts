import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { DirectoryRoleGuard } from './guards/directory-role.guard';
import { RequireAdmin } from './roles.decorator';
import { RolesService, RoleUserResponse, PaginatedRoleUsers, RoleSummary } from './roles.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { QueryRolesDto } from './dto/query-roles.dto';
import { CheckPermissionDto } from './dto/check-permission.dto';
import { UserRole } from '@bcc/shared';
import { PermissionContext } from './permissions.interface';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('users')
  @RequireAdmin()
  async getUsersWithRoles(
    @Query() query: QueryRolesDto
  ): Promise<PaginatedRoleUsers> {
    return this.rolesService.getUsersWithRoles(
      query.query,
      query.role,
      query.page,
      query.limit
    );
  }

  @Get('summary')
  @RequireAdmin()
  async getRoleSummary(): Promise<RoleSummary> {
    return this.rolesService.getRoleSummary();
  }

  @Get('users/:id')
  @RequireAdmin()
  async getUserRole(
    @Param('id') id: string
  ): Promise<{ userId: string; role: UserRole }> {
    const role = await this.rolesService.getUserRole(id);
    return { userId: id, role };
  }

  @Patch('users/:id')
  @RequireAdmin()
  async updateUserRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserRoleDto
  ): Promise<RoleUserResponse> {
    return this.rolesService.updateUserRole(
      req.user.id,
      targetUserId,
      dto.role
    );
  }

  @Get('directory-access')
  @UseGuards(DirectoryRoleGuard)
  async checkDirectoryAccess(
    @Req() req: AuthenticatedRequest
  ): Promise<{ allowed: boolean; role: UserRole }> {
    return { allowed: true, role: req.user.role };
  }

  @Post('check-permission')
  @HttpCode(HttpStatus.OK)
  async checkPermission(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CheckPermissionDto
  ): Promise<{ allowed: boolean; action: string }> {
    const context: PermissionContext = {
      userId: req.user.id,
      role: req.user.role,
      teamId: dto.teamId,
      channelId: dto.channelId,
      teamRole: dto.teamRole,
      isChannelOwner: dto.isChannelOwner,
      isChannelMember: dto.isChannelMember,
    };

    await this.rolesService.enforcePermission(context, dto.action);
    return { allowed: true, action: dto.action };
  }
}
