import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  // The user's email address
  @IsEmail()
  email!: string;

  // The user's password (minimum 6 characters)
  @IsString()
  @Length(6, 255)
  password!: string;
}
