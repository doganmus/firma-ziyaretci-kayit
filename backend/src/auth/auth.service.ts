import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly jwt: JwtService) {}

  // Checks email and password against the database
  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  // Creates a signed JWT token for the user to authenticate future requests
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    };
  }
}
