import { IsEmail, IsIn, IsString, Length } from 'class-validator';
import { UserRole } from '../user.entity';

const ROLES: UserRole[] = ['ADMIN', 'OPERATOR', 'VIEWER'];

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 255)
  password!: string;

  @IsString()
  @Length(2, 150)
  full_name!: string;

  @IsIn(ROLES)
  role!: UserRole;
}
