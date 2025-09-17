import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async findAll(): Promise<User[]> {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async create(params: { email: string; password_hash: string; full_name: string; role: UserRole }): Promise<User> {
    const entity = this.repo.create(params);
    return this.repo.save(entity);
  }

  async update(id: string, update: Partial<User>): Promise<User> {
    await this.repo.update({ id }, update);
    const after = await this.repo.findOne({ where: { id } });
    return after as User;
  }

  async remove(id: string) {
    return this.repo.delete({ id });
  }
}
