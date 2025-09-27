import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Admin endpoints
  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  list(): Promise<User[]> {
    return this.users.findAll();
  }

  @Post('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: CreateUserDto): Promise<User> {
    const password_hash = await bcrypt.hash(body.password, 10);
    return this.users.create({ email: body.email, password_hash, full_name: body.full_name, role: body.role });
  }

  @Patch('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<User> {
    const update: Partial<User> = {};
    if (body.full_name) update.full_name = body.full_name;
    if (body.role) update.role = body.role;
    if (body.password) update['password_hash' as keyof User] = await bcrypt.hash(body.password, 10) as any;
    return this.users.update(id, update);
  }

  @Delete('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }

  // Self-service: change own password
  @Patch('users/me/password')
  @UseGuards(JwtAuthGuard)
  async changeMyPassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    const userId = req.user?.userId as string | undefined;
    if (!userId) throw new BadRequestException('Unauthorized');
    if (!body?.currentPassword || !body?.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('Yeni şifre en az 6 karakter olmalı');
    }
    const me = await this.users.findById(userId);
    if (!me) throw new BadRequestException('User not found');
    const ok = await bcrypt.compare(body.currentPassword, me.password_hash);
    if (!ok) throw new BadRequestException('Mevcut şifre hatalı');
    const password_hash = await bcrypt.hash(body.newPassword, 10);
    await this.users.update(userId, { password_hash });
    return { ok: true };
  }
}
