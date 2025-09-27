import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from '../visits/visit.entity';

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(Visit) private readonly repo: Repository<Visit>) {}

  // Builds a quick statistics object for the given date range
  async summary(dateFrom?: string, dateTo?: string) {
    const qb = this.repo.createQueryBuilder('v');
    if (dateFrom) qb.andWhere('v.entry_at >= :df', { df: new Date(dateFrom) });
    if (dateTo) qb.andWhere('v.entry_at <= :dt', { dt: new Date(dateTo) });

    const total = await qb.getCount();
    const withVehicle = await qb.clone().andWhere('v.has_vehicle = true').getCount();
    const withoutVehicle = await qb.clone().andWhere('v.has_vehicle = false').getCount();
    const active = await qb.clone().andWhere('v.exit_at IS NULL').getCount();
    const exited = await qb.clone().andWhere('v.exit_at IS NOT NULL').getCount();

    return { total, withVehicle, withoutVehicle, active, exited };
  }

  // Returns number of visits per company name for the given date range
  async byCompany(dateFrom?: string, dateTo?: string) {
    const qb = this.repo.createQueryBuilder('v')
      .select('v.company_name', 'company')
      .addSelect('COUNT(*)', 'count')
      .groupBy('v.company_name')
      .orderBy('count', 'DESC');

    if (dateFrom) qb.andWhere('v.entry_at >= :df', { df: new Date(dateFrom) });
    if (dateTo) qb.andWhere('v.entry_at <= :dt', { dt: new Date(dateTo) });

    const rows = await qb.getRawMany<{ company: string; count: string }>();
    return rows.map((r) => ({ company: r.company, count: Number(r.count) }));
  }
}
