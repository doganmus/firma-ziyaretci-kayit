import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from './visit.entity';

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)[A-Z]{1,3}[0-9]{2,4}$/;

@Injectable()
export class VisitsService {
  constructor(@InjectRepository(Visit) private readonly repo: Repository<Visit>) {}

  async list(filters?: {
    dateFrom?: string;
    dateTo?: string;
    company?: string;
    hasVehicle?: boolean;
    plate?: string;
    visitedPerson?: string;
  }): Promise<Visit[]> {
    const qb = this.repo.createQueryBuilder('v').orderBy('v.entry_at', 'DESC');

    if (filters?.dateFrom) qb.andWhere('v.entry_at >= :df', { df: new Date(filters.dateFrom) });
    if (filters?.dateTo) qb.andWhere('v.entry_at <= :dt', { dt: new Date(filters.dateTo) });
    if (filters?.company) qb.andWhere('v.company_name ILIKE :c', { c: `%${filters.company}%` });
    if (typeof filters?.hasVehicle === 'boolean') qb.andWhere('v.has_vehicle = :hv', { hv: filters.hasVehicle });
    if (filters?.plate) qb.andWhere("REPLACE(UPPER(v.vehicle_plate), ' ', '') LIKE :p", { p: `%${filters.plate.replace(/\s+/g, '').toUpperCase()}%` });
    if (filters?.visitedPerson) qb.andWhere('v.visited_person_full_name ILIKE :vp', { vp: `%${filters.visitedPerson}%` });

    return qb.getMany();
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
    let normalizedPlate: string | null = null;
    if (payload.has_vehicle) {
      if (!payload.vehicle_plate) {
        throw new BadRequestException('vehicle_plate required when has_vehicle is true');
      }
      normalizedPlate = payload.vehicle_plate.replace(/\s+/g, '').toUpperCase();
      if (!TR_PLATE_REGEX.test(normalizedPlate)) {
        throw new BadRequestException('vehicle_plate must match TR plate format (e.g. 34ABC1234)');
      }
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
      vehicle_plate: payload.has_vehicle ? normalizedPlate : null,
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
