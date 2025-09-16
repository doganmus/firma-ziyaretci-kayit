import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  async create(@Body() body: { email: string; password: string; full_name: string; role: UserRole }): Promise<User> {
    const password_hash = await bcrypt.hash(body.password, 10);
    return this.users.create({ email: body.email, password_hash, full_name: body.full_name, role: body.role });
  }
}
