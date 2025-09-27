import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { UserRole } from '../user.entity';

const ROLES: UserRole[] = ['ADMIN', 'OPERATOR', 'VIEWER'];

export class UpdateUserDto {
  // Optional full name change
  @IsOptional()
  @IsString()
  @Length(2, 150)
  full_name?: string;

  // Optional password change
  @IsOptional()
  @IsString()
  @Length(6, 255)
  password?: string;

  // Optional role change
  @IsOptional()
  @IsIn(ROLES)
  role?: UserRole;
}
