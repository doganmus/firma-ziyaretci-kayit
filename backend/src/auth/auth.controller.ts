import { Body, Controller, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

// Parse expiration string (e.g., '24h', '12h', '1d') to milliseconds
function parseExpirationToMs(expiration: string): number {
  const match = expiration.match(/^(\d+)([hdms])$/);
  if (!match) {
    // Default to 24h if invalid format
    return 24 * 60 * 60 * 1000;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    case 's':
      return value * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Receives email and password, returns a JWT and basic user info
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 1 dakikada en fazla 5 deneme
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body.email, body.password);
    // HttpOnly cookie for the JWT token
    // Parse JWT_EXPIRATION to milliseconds for cookie maxAge
    const expiration = process.env.JWT_EXPIRATION || '24h';
    const maxAgeMs = parseExpirationToMs(expiration);
    
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAgeMs,
      path: '/',
    });
    return { user: result.user };
  }

  // Optional logout endpoint to clear cookie
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }
}
