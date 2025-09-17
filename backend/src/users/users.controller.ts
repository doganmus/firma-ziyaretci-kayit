import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(): Promise<User[]> {
    return this.users.findAll();
  }

  @Post()
  async create(@Body() body: CreateUserDto): Promise<User> {
    const password_hash = await bcrypt.hash(body.password, 10);
    return this.users.create({ email: body.email, password_hash, full_name: body.full_name, role: body.role });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<User> {
    const update: Partial<User> = {};
    if (body.full_name) update.full_name = body.full_name;
    if (body.role) update.role = body.role;
    if (body.password) update['password_hash' as keyof User] = await bcrypt.hash(body.password, 10) as any;
    return this.users.update(id, update);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
