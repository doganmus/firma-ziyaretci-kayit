import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Receives email and password, returns a JWT and basic user info
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }
}
