import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from './visit.entity';

@Injectable()
export class VisitsService {
  constructor(@InjectRepository(Visit) private readonly repo: Repository<Visit>) {}

  async list(): Promise<Visit[]> {
    return this.repo.find({ order: { entry_at: 'DESC' } });
  }

  async create(payload: {
    entry_at: string;
    exit_at?: string | null;
    visitor_full_name: string;
    visited_person_full_name: string;
    company_name: string;
    has_vehicle: boolean;
    vehicle_plate?: string | null;
  }): Promise<Visit> {
    if (payload.has_vehicle && !payload.vehicle_plate) {
      throw new BadRequestException('vehicle_plate required when has_vehicle is true');
    }
    if (!payload.has_vehicle) {
      payload.vehicle_plate = null;
    }
    const entryAt = new Date(payload.entry_at);
    const date = entryAt.toISOString().slice(0, 10);

    const visit = this.repo.create({
      date,
      entry_at: entryAt,
      exit_at: payload.exit_at ? new Date(payload.exit_at) : null,
      visitor_full_name: payload.visitor_full_name,
      visited_person_full_name: payload.visited_person_full_name,
      company_name: payload.company_name,
      has_vehicle: payload.has_vehicle,
      vehicle_plate: payload.vehicle_plate ?? null,
    });
    return this.repo.save(visit);
  }

  async exit(id: string): Promise<Visit> {
    const visit = await this.repo.findOne({ where: { id } });
    if (!visit) throw new BadRequestException('Visit not found');
    visit.exit_at = new Date();
    return this.repo.save(visit);
  }
}
