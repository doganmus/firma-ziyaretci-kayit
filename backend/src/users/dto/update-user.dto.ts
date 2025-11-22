import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { UserRole } from '../user.entity';
import { IsStrongPassword } from '../../common/validators/password-strength.validator';

const ROLES: UserRole[] = ['ADMIN', 'OPERATOR', 'VIEWER'];

export class UpdateUserDto {
  // Optional full name change
  @IsOptional()
  @IsString()
  @Length(2, 150)
  full_name?: string;

  // Optional password change (min 8 characters, must include uppercase, lowercase, digit, and special character)
  @IsOptional()
  @IsString()
  @IsStrongPassword()
  password?: string;

  // Optional role change
  @IsOptional()
  @IsIn(ROLES)
  role?: UserRole;
}
