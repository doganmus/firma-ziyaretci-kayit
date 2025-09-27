import { IsEmail, IsIn, IsString, Length } from 'class-validator';
import { UserRole } from '../user.entity';

const ROLES: UserRole[] = ['ADMIN', 'OPERATOR', 'VIEWER'];

export class CreateUserDto {
  // New user's email address (must be unique)
  @IsEmail()
  email!: string;

  // Initial password for the user (min 6 characters)
  @IsString()
  @Length(6, 255)
  password!: string;

  // Full name displayed in the UI
  @IsString()
  @Length(2, 150)
  full_name!: string;

  // Role determines permissions in the app
  @IsIn(ROLES)
  role!: UserRole;
}
