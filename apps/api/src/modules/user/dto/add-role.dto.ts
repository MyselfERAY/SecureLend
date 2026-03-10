import { IsIn } from 'class-validator';
import { UserRole } from '@prisma/client';

export class AddRoleDto {
  @IsIn([UserRole.TENANT, UserRole.LANDLORD], {
    message: 'Gecerli bir rol secin (TENANT veya LANDLORD)',
  })
  role!: UserRole;
}
