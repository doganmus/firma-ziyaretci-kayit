import { IsEmail, IsIn, IsString, Length } from 'class-validator';
import { UserRole } from '../user.entity';
import { IsStrongPassword } from '../../common/validators/password-strength.validator';

const ROLES: UserRole[] = ['ADMIN', 'OPERATOR', 'VIEWER'];

export class CreateUserDto {
  // New user's email address (must be unique)
  @IsEmail()
  email!: string;

  // Initial password for the user (min 8 characters, must include uppercase, lowercase, digit, and special character)
  @IsString()
  @IsStrongPassword()
  password!: string;

  // Full name displayed in the UI
  @IsString()
  @Length(2, 150)
  full_name!: string;

  // Role determines permissions in the app
  @IsIn(ROLES)
  role!: UserRole;
}
