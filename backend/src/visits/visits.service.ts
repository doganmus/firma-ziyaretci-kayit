import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from './visit.entity';

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/;

@Injectable()
export class VisitsService {
  constructor(@InjectRepository(Visit) private readonly repo: Repository<Visit>) {}

  // Returns visits filtered by optional parameters
  async list(filters?: {
    dateFrom?: string;
    dateTo?: string;
    company?: string;
    hasVehicle?: boolean;
    plate?: string;
    visitedPerson?: string;
    active?: boolean;
    sortKey?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Visit[]; total: number }> {
    const qb = this.repo.createQueryBuilder('v');

    if (filters?.dateFrom) qb.andWhere('v.entry_at >= :df', { df: new Date(filters.dateFrom) });
    if (filters?.dateTo) qb.andWhere('v.entry_at <= :dt', { dt: new Date(filters.dateTo) });
    if (filters?.company) qb.andWhere('v.company_name ILIKE :c', { c: `%${filters.company}%` });
    if (typeof filters?.hasVehicle === 'boolean') qb.andWhere('v.has_vehicle = :hv', { hv: filters.hasVehicle });
    if (filters?.plate) qb.andWhere("REPLACE(UPPER(v.vehicle_plate), ' ', '') LIKE :p", { p: `%${filters.plate.replace(/\s+/g, '').toUpperCase()}%` });
    if (filters?.visitedPerson) qb.andWhere('v.visited_person_full_name ILIKE :vp', { vp: `%${filters.visitedPerson}%` });
    
    // Filter for active visits (exit_at IS NULL)
    if (typeof filters?.active === 'boolean' && filters.active) {
      qb.andWhere('v.exit_at IS NULL');
    }

    // Sorting
    const sortable = new Set(['entry_at','exit_at','visitor_full_name','visited_person_full_name','company_name']);
    const sortKey = (filters?.sortKey && sortable.has(filters.sortKey)) ? filters.sortKey : 'entry_at';
    const sortOrder = (filters?.sortOrder === 'asc') ? 'ASC' : 'DESC';
    qb.orderBy(`v.${sortKey}`, sortOrder as 'ASC'|'DESC');

    // Pagination - active visits may need higher limit
    const page = Math.max(1, Number(filters?.page || 1));
    const maxPageSize = filters?.active ? 1000 : 100; // Higher limit for active visits
    const pageSize = Math.max(1, Math.min(maxPageSize, Number(filters?.pageSize || 10)));
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  // Creates a new visit, normalizing and validating the plate when needed
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
      visitor_full_name: payload.visitor_full_name.toLocaleUpperCase('tr-TR'),
      visited_person_full_name: payload.visited_person_full_name.toLocaleUpperCase('tr-TR'),
      company_name: payload.company_name.toLocaleUpperCase('tr-TR'),
      has_vehicle: payload.has_vehicle,
      vehicle_plate: payload.has_vehicle ? normalizedPlate : null,
    });
    return this.repo.save(visit);
  }

  // Sets the exit time for a visit to now
  async update(id: string, payload: {
    entry_at?: string;
    exit_at?: string | null;
    visitor_full_name?: string;
    visited_person_full_name?: string;
    company_name?: string;
    has_vehicle?: boolean;
    vehicle_plate?: string | null;
  }): Promise<Visit> {
    const visit = await this.repo.findOne({ where: { id } });
    if (!visit) throw new BadRequestException('Visit not found');

    if (typeof payload.entry_at === 'string') {
      const entryAt = new Date(payload.entry_at);
      visit.entry_at = entryAt;
      visit.date = entryAt.toISOString().slice(0, 10);
    }
    if (typeof payload.exit_at !== 'undefined') {
      visit.exit_at = payload.exit_at ? new Date(payload.exit_at) : null;
    }
    if (typeof payload.visitor_full_name === 'string') visit.visitor_full_name = payload.visitor_full_name.toLocaleUpperCase('tr-TR');
    if (typeof payload.visited_person_full_name === 'string') visit.visited_person_full_name = payload.visited_person_full_name.toLocaleUpperCase('tr-TR');
    if (typeof payload.company_name === 'string') visit.company_name = payload.company_name.toLocaleUpperCase('tr-TR');

    if (typeof payload.has_vehicle === 'boolean') {
      visit.has_vehicle = payload.has_vehicle;
      if (!payload.has_vehicle) {
        visit.vehicle_plate = null;
      }
    }
    if (typeof payload.vehicle_plate === 'string') {
      const normalized = payload.vehicle_plate.replace(/\s+/g, '').toUpperCase();
      if (!TR_PLATE_REGEX.test(normalized)) {
        throw new BadRequestException('vehicle_plate must match TR plate format (e.g. 34ABC1234)');
      }
      visit.vehicle_plate = normalized;
    }

    return this.repo.save(visit);
  }
}
