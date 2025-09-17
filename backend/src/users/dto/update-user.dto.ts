import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { UserRole } from '../user.entity';

const ROLES: UserRole[] = ['ADMIN', 'OPERATOR', 'VIEWER'];

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  full_name?: string;

  @IsOptional()
  @IsString()
  @Length(6, 255)
  password?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: UserRole;
}
