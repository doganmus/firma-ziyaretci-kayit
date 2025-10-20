import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleLog } from './vehicle-log.entity';

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/;

@Injectable()
export class VehicleLogsService {
  constructor(@InjectRepository(VehicleLog) private readonly repo: Repository<VehicleLog>) {}

  async list(filters?: {
    dateFrom?: string;
    dateTo?: string;
    plate?: string;
    active?: boolean;
    district?: string;
    vehicleType?: string;
    sortKey?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: VehicleLog[]; total: number }> {
    const qb = this.repo.createQueryBuilder('v');
    if (filters?.dateFrom) qb.andWhere('v.entry_at >= :df', { df: new Date(filters.dateFrom) });
    if (filters?.dateTo) qb.andWhere('v.entry_at <= :dt', { dt: new Date(filters.dateTo) });
    if (typeof filters?.active === 'boolean') qb.andWhere(filters.active ? 'v.exit_at IS NULL' : 'v.exit_at IS NOT NULL');
    if (filters?.plate) qb.andWhere("REPLACE(UPPER(v.plate), ' ', '') LIKE :p", { p: `%${filters.plate.replace(/\s+/g, '').toUpperCase()}%` });
    if (filters?.district) qb.andWhere('v.district ILIKE :d', { d: `%${filters.district}%` });
    if (filters?.vehicleType) qb.andWhere('v.vehicle_type ILIKE :t', { t: `%${filters.vehicleType}%` });

    const sortable = new Set(['entry_at', 'exit_at', 'plate', 'district', 'vehicle_type']);
    const sortKey = (filters?.sortKey && sortable.has(filters.sortKey)) ? filters.sortKey : 'entry_at';
    const sortOrder = (filters?.sortOrder === 'asc') ? 'ASC' : 'DESC';
    qb.orderBy(`v.${sortKey}`, sortOrder as 'ASC'|'DESC');

    const page = Math.max(1, Number(filters?.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(filters?.pageSize || 10)));
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async create(payload: { plate: string; entry_at?: string; exit_at?: string | null; district: string; vehicle_type: string; note?: string | null }): Promise<VehicleLog> {
    const normalizedPlate = (payload.plate ?? '').replace(/\s+/g, '').toUpperCase();
    if (!TR_PLATE_REGEX.test(normalizedPlate)) {
      throw new BadRequestException('plate must match TR plate format (e.g. 34ABC1234)');
    }
    if (!payload.district || !payload.district.trim()) {
      throw new BadRequestException('district is required');
    }
    if (!payload.vehicle_type || !payload.vehicle_type.trim()) {
      throw new BadRequestException('vehicle_type is required');
    }
    const entryAt = payload.entry_at ? new Date(payload.entry_at) : new Date();
    const date = entryAt.toISOString().slice(0, 10);

    const log = this.repo.create({
      plate: normalizedPlate,
      entry_at: entryAt,
      exit_at: payload.exit_at ? new Date(payload.exit_at) : null,
      date,
      district: payload.district,
      vehicle_type: payload.vehicle_type,
      note: payload.note ?? null,
    });
    return this.repo.save(log);
  }

  async exit(id: string): Promise<VehicleLog> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new BadRequestException('VehicleLog not found');
    item.exit_at = new Date();
    return this.repo.save(item);
  }
}


