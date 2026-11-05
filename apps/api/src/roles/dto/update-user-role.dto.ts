import { IsIn, IsNotEmpty } from 'class-validator';
import { UserRole } from '@bcc/shared';

export class UpdateUserRoleDto {
  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(['ADMIN', 'MEMBER', 'GUEST'], {
    message: 'Role must be one of: ADMIN, MEMBER, GUEST',
  })
  role!: UserRole;
}
