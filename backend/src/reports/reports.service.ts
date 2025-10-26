import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEvent } from '../vehicle-events/vehicle-event.entity';
import { Visit } from '../visits/visit.entity';
import { VehicleLog } from '../vehicle-logs/vehicle-log.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Visit) private readonly repo: Repository<Visit>,
    @InjectRepository(VehicleLog) private readonly vehicles: Repository<VehicleLog>,
    @InjectRepository(VehicleEvent) private readonly vehicleEvents: Repository<VehicleEvent>,
  ) {}

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

  // Dashboard overview combining visits and vehicle logs
  async dashboardOverview(dateFrom?: string, dateTo?: string) {
    const df = dateFrom ? new Date(dateFrom) : undefined;
    const dt = dateTo ? new Date(dateTo) : undefined;

    // KPIs
    const visitBase = this.repo.createQueryBuilder('v');
    if (df) visitBase.andWhere('v.entry_at >= :df', { df });
    if (dt) visitBase.andWhere('v.entry_at <= :dt', { dt });
    const visitsTotal = await visitBase.getCount();
    const visitsActive = await visitBase.clone().andWhere('v.exit_at IS NULL').getCount();

    const vehicleBase = this.vehicles.createQueryBuilder('vl');
    if (df) vehicleBase.andWhere('vl.entry_at >= :df', { df });
    if (dt) vehicleBase.andWhere('vl.entry_at <= :dt', { dt });
    const vehiclesTotal = await vehicleBase.getCount();
    const vehiclesActive = await vehicleBase.clone().andWhere('vl.exit_at IS NULL').getCount();

    // Time series (last 30 days if no range)
    const tsVisits = await this.repo.createQueryBuilder('v')
      .select("date_trunc('day', v.entry_at)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where(df ? 'v.entry_at >= :df' : 'v.entry_at >= :df_auto', { df: df, df_auto: new Date(Date.now() - 30*24*60*60*1000) })
      .andWhere(dt ? 'v.entry_at <= :dt' : '1=1', { dt })
      .groupBy("date_trunc('day', v.entry_at)")
      .orderBy('day', 'ASC')
      .getRawMany<{ day: Date; count: string }>();

    const tsVehicles = await this.vehicles.createQueryBuilder('vl')
      .select("date_trunc('day', vl.entry_at)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where(df ? 'vl.entry_at >= :df' : 'vl.entry_at >= :df_auto', { df: df, df_auto: new Date(Date.now() - 30*24*60*60*1000) })
      .andWhere(dt ? 'vl.entry_at <= :dt' : '1=1', { dt })
      .groupBy("date_trunc('day', vl.entry_at)")
      .orderBy('day', 'ASC')
      .getRawMany<{ day: Date; count: string }>();

    // Vehicle types breakdown
    const vehicleTypes = await this.vehicles.createQueryBuilder('vl')
      .select('vl.vehicle_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where(df ? 'vl.entry_at >= :df' : '1=1', { df })
      .andWhere(dt ? 'vl.entry_at <= :dt' : '1=1', { dt })
      .groupBy('vl.vehicle_type')
      .orderBy('count', 'DESC')
      .getRawMany<{ type: string | null; count: string }>();

    // Top companies (visits)
    const topCompanies = await this.repo.createQueryBuilder('v')
      .select('v.company_name', 'company')
      .addSelect('COUNT(*)', 'count')
      .where(df ? 'v.entry_at >= :df' : '1=1', { df })
      .andWhere(dt ? 'v.entry_at <= :dt' : '1=1', { dt })
      .groupBy('v.company_name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ company: string; count: string }>();

    return {
      kpis: {
        visitsTotal,
        visitsActive,
        vehiclesTotal,
        vehiclesActive,
      },
      timeSeries: {
        visitsDaily: tsVisits.map(r => ({ day: (r as any).day, count: Number(r.count) })),
        vehiclesDaily: tsVehicles.map(r => ({ day: (r as any).day, count: Number(r.count) })),
      },
      vehicleTypeBreakdown: vehicleTypes.map(r => ({ type: r.type || 'BİLİNMİYOR', count: Number(r.count) })),
      topCompanies: topCompanies.map(r => ({ company: r.company, count: Number(r.count) })),
    };
  }

  // Optional granular daily report for visits and vehicles
  async byDay(dateFrom?: string, dateTo?: string) {
    const df = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30*24*60*60*1000);
    const dt = dateTo ? new Date(dateTo) : new Date();

    const visits = await this.repo.createQueryBuilder('v')
      .select("date_trunc('day', v.entry_at)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('v.entry_at >= :df', { df })
      .andWhere('v.entry_at <= :dt', { dt })
      .groupBy("date_trunc('day', v.entry_at)")
      .orderBy('day', 'ASC')
      .getRawMany<{ day: Date; count: string }>();

    const vehicles = await this.vehicles.createQueryBuilder('vl')
      .select("date_trunc('day', vl.entry_at)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('vl.entry_at >= :df', { df })
      .andWhere('vl.entry_at <= :dt', { dt })
      .groupBy("date_trunc('day', vl.entry_at)")
      .orderBy('day', 'ASC')
      .getRawMany<{ day: Date; count: string }>();

    return {
      visitsDaily: visits.map(r => ({ day: (r as any).day, count: Number(r.count) })),
      vehiclesDaily: vehicles.map(r => ({ day: (r as any).day, count: Number(r.count) })),
    }
  }

  // Optional vehicle summary grouped by type
  async vehicleSummary(dateFrom?: string, dateTo?: string) {
    const df = dateFrom ? new Date(dateFrom) : undefined;
    const dt = dateTo ? new Date(dateTo) : undefined;
    const byType = await this.vehicles.createQueryBuilder('vl')
      .select('vl.vehicle_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where(df ? 'vl.entry_at >= :df' : '1=1', { df })
      .andWhere(dt ? 'vl.entry_at <= :dt' : '1=1', { dt })
      .groupBy('vl.vehicle_type')
      .orderBy('count', 'DESC')
      .getRawMany<{ type: string | null; count: string }>();
    return byType.map(r => ({ type: r.type || 'BİLİNMİYOR', count: Number(r.count) }));
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
