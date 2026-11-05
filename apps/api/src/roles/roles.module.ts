import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RolesGuard } from './roles.guard';
import { DirectoryRoleGuard } from './guards/directory-role.guard';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, RolesGuard, DirectoryRoleGuard],
  exports: [RolesService, RolesGuard, DirectoryRoleGuard],
})
export class RolesModule {}
