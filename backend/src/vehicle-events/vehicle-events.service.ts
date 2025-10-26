import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { VehicleEvent } from './vehicle-event.entity';

@Injectable()
export class VehicleEventsService {
  constructor(@InjectRepository(VehicleEvent) private readonly repo: Repository<VehicleEvent>) {}

  private applyFilters(qb: SelectQueryBuilder<VehicleEvent>, filters?: {
    dateFrom?: string;
    dateTo?: string;
    plate?: string;
    action?: 'ENTRY' | 'EXIT';
    district?: string;
    vehicleType?: string;
    active?: boolean;
    sortKey?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
  }) {
    if (filters?.dateFrom) qb.andWhere('e.at >= :df', { df: new Date(filters.dateFrom) });
    if (filters?.dateTo) qb.andWhere('e.at <= :dt', { dt: new Date(filters.dateTo) });
    if (filters?.plate) qb.andWhere("REPLACE(UPPER(e.plate), ' ', '') LIKE :p", { p: `%${filters.plate.replace(/\s+/g, '').toUpperCase()}%` });
    if (filters?.action) qb.andWhere('e.action = :a', { a: filters.action });
    if (filters?.district) qb.andWhere('e.district ILIKE :d', { d: `%${filters.district}%` });
    if (filters?.vehicleType) qb.andWhere('e.vehicle_type ILIKE :t', { t: `%${filters.vehicleType}%` });

    if (typeof filters?.active === 'boolean') {
      if (filters.active) {
        // Active = ENTRY event with no subsequent EXIT on same date for same plate
        qb.andWhere("e.action = 'ENTRY'")
          .andWhere(`NOT EXISTS (
            SELECT 1 FROM vehicle_events e2
            WHERE e2.plate = e.plate AND e2.date = e.date AND e2.action = 'EXIT' AND e2.at > e.at
          )`);
      } else {
        qb.andWhere("e.action = 'EXIT'");
      }
    }

    const sortable = new Set(['at', 'plate', 'action', 'district', 'vehicle_type']);
    const sortKey = (filters?.sortKey && sortable.has(filters.sortKey)) ? filters.sortKey : 'at';
    const sortOrder = (filters?.sortOrder === 'asc') ? 'ASC' : 'DESC';
    qb.orderBy(`e.${sortKey}`, sortOrder as 'ASC'|'DESC');

    const page = Math.max(1, Number(filters?.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(filters?.pageSize || 10)));
    qb.skip((page - 1) * pageSize).take(pageSize);
  }

  async list(filters?: Parameters<VehicleEventsService['applyFilters']>[1]): Promise<{ data: VehicleEvent[]; total: number }> {
    const qb = this.repo.createQueryBuilder('e');
    this.applyFilters(qb, filters);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async create(payload: { action: 'ENTRY' | 'EXIT'; at: string; plate: string; district?: string | null; vehicle_type?: string | null; note?: string | null; }): Promise<VehicleEvent> {
    const at = new Date(payload.at);
    if (Number.isNaN(at.getTime())) throw new BadRequestException('Invalid date');
    const date = at.toISOString().slice(0, 10);
    const normalizedPlate = (payload.plate ?? '').replace(/\s+/g, '').toUpperCase();

    if (payload.action === 'EXIT') {
      // Aynı gün aynı plaka için en az bir ENTRY var mı?
      const hasEntry = await this.repo.createQueryBuilder('e')
        .where("e.plate = :p AND e.date = :d AND e.action = 'ENTRY'", { p: normalizedPlate, d: date })
        .getExists();
      if (!hasEntry) {
        throw new BadRequestException('Giriş kaydı olmayan aracın çıkış kaydı olamaz!');
      }
      // EXIT zamanı, aynı gün herhangi bir ENTRY ile birebir aynı olamaz
      const sameTimeEntry = await this.repo.createQueryBuilder('e')
        .where("e.plate = :p AND e.date = :d AND e.action = 'ENTRY' AND e.at = :at", { p: normalizedPlate, d: date, at })
        .getExists();
      if (sameTimeEntry) {
        throw new BadRequestException('Giriş saati ile Çıkış saati aynı olamaz!');
      }
    }

    const entity = this.repo.create({
      action: payload.action,
      at,
      date,
      plate: normalizedPlate,
      district: payload.district ?? null,
      vehicle_type: payload.vehicle_type ?? null,
      note: payload.note ?? null,
    });
    return this.repo.save(entity);
  }

  async update(id: string, payload: Partial<{ action: 'ENTRY' | 'EXIT'; at: string; plate: string; district?: string | null; vehicle_type?: string | null; note?: string | null; }>): Promise<VehicleEvent> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new BadRequestException('VehicleEvent not found');
    if (payload.action) entity.action = payload.action;
    if (typeof payload.at === 'string') {
      const at = new Date(payload.at);
      if (Number.isNaN(at.getTime())) throw new BadRequestException('Invalid date');
      entity.at = at;
      entity.date = at.toISOString().slice(0, 10);
    }
    if (payload.plate) entity.plate = payload.plate.replace(/\s+/g, '').toUpperCase();
    if (typeof payload.district !== 'undefined') entity.district = payload.district ?? null;
    if (typeof payload.vehicle_type !== 'undefined') entity.vehicle_type = payload.vehicle_type ?? null;
    if (typeof payload.note !== 'undefined') entity.note = payload.note ?? null;
    return this.repo.save(entity);
  }
}


