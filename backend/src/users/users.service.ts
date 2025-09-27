import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  // Returns all users, newest first
  async findAll(): Promise<User[]> {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  // Finds a single user by id
  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  // Finds a single user by email
  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  // Creates and saves a new user
  async create(params: { email: string; password_hash: string; full_name: string; role: UserRole }): Promise<User> {
    const entity = this.repo.create(params);
    return this.repo.save(entity);
  }

  // Applies partial updates then returns the updated user
  async update(id: string, update: Partial<User>): Promise<User> {
    await this.repo.update({ id }, update);
    const after = await this.repo.findOne({ where: { id } });
    return after as User;
  }

  // Deletes a user by id
  async remove(id: string) {
    return this.repo.delete({ id });
  }
}
