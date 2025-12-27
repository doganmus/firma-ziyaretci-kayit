import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, IsNull, Not } from 'typeorm';
import { VehicleRecord } from './vehicle-record.entity';

@Injectable()
export class VehicleRecordsService {
    constructor(@InjectRepository(VehicleRecord) private readonly repo: Repository<VehicleRecord>) { }

    private applyFilters(qb: SelectQueryBuilder<VehicleRecord>, filters?: {
        dateFrom?: string;
        dateTo?: string;
        plate?: string;
        district?: string;
        vehicleType?: string;
        hasExit?: boolean;
        sortKey?: string;
        sortOrder?: string;
        page?: number;
        pageSize?: number;
    }) {
        if (filters?.dateFrom) qb.andWhere('e.entry_at >= :df', { df: new Date(filters.dateFrom) });
        if (filters?.dateTo) qb.andWhere('e.entry_at <= :dt', { dt: new Date(filters.dateTo) });
        if (filters?.plate) qb.andWhere("REPLACE(UPPER(e.plate), ' ', '') LIKE :p", { p: `%${filters.plate.replace(/\s+/g, '').toUpperCase()}%` });
        if (filters?.district) qb.andWhere('e.district ILIKE :d', { d: `%${filters.district}%` });
        if (filters?.vehicleType) qb.andWhere('e.vehicle_type ILIKE :t', { t: `%${filters.vehicleType}%` });

        // Filter by exit status
        if (typeof filters?.hasExit === 'boolean') {
            if (filters.hasExit) {
                qb.andWhere('e.exit_at IS NOT NULL');
            } else {
                qb.andWhere('e.exit_at IS NULL');
            }
        }

        const sortable = new Set(['entry_at', 'exit_at', 'plate', 'district', 'vehicle_type']);
        const sortKey = (filters?.sortKey && sortable.has(filters.sortKey)) ? filters.sortKey : 'entry_at';
        const sortOrder = (filters?.sortOrder === 'asc') ? 'ASC' : 'DESC';
        qb.orderBy(`e.${sortKey}`, sortOrder as 'ASC' | 'DESC');

        const page = Math.max(1, Number(filters?.page || 1));
        const pageSize = Math.max(1, Math.min(100, Number(filters?.pageSize || 10)));
        qb.skip((page - 1) * pageSize).take(pageSize);
    }

    async list(filters?: Parameters<VehicleRecordsService['applyFilters']>[1]): Promise<{ data: VehicleRecord[]; total: number }> {
        const qb = this.repo.createQueryBuilder('e');
        this.applyFilters(qb, filters);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    // Giriş kaydı oluştur
    async createEntry(payload: {
        entry_at: string;
        plate: string;
        district?: string | null;
        vehicle_type?: string | null;
        note?: string | null;
    }): Promise<VehicleRecord> {
        const entry_at = new Date(payload.entry_at);
        if (Number.isNaN(entry_at.getTime())) throw new BadRequestException('Geçersiz tarih');
        const date = entry_at.toISOString().slice(0, 10);
        const normalizedPlate = (payload.plate ?? '').replace(/\s+/g, '').toUpperCase();

        const entity = this.repo.create({
            entry_at,
            exit_at: null,
            date,
            plate: normalizedPlate,
            district: payload.district ?? null,
            vehicle_type: payload.vehicle_type ?? null,
            note: payload.note ?? null,
        });
        return this.repo.save(entity);
    }

    // Çıkış kaydı ekle (mevcut kayda)
    async addExit(id: string, exit_at: string): Promise<VehicleRecord> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new BadRequestException('Kayıt bulunamadı');

        const exitDate = new Date(exit_at);
        if (Number.isNaN(exitDate.getTime())) throw new BadRequestException('Geçersiz çıkış tarihi');

        // Çıkış tarihi giriş tarihinden önce olamaz
        if (exitDate <= entity.entry_at) {
            throw new BadRequestException('Çıkış tarihi giriş tarihinden sonra olmalıdır');
        }

        entity.exit_at = exitDate;
        return this.repo.save(entity);
    }

    // Kayıt güncelle
    async update(id: string, payload: Partial<{
        entry_at: string;
        exit_at: string | null;
        plate: string;
        district?: string | null;
        vehicle_type?: string | null;
        note?: string | null;
    }>): Promise<VehicleRecord> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new BadRequestException('Kayıt bulunamadı');

        if (typeof payload.entry_at === 'string') {
            const entry_at = new Date(payload.entry_at);
            if (Number.isNaN(entry_at.getTime())) throw new BadRequestException('Geçersiz giriş tarihi');
            entity.entry_at = entry_at;
            entity.date = entry_at.toISOString().slice(0, 10);
        }

        if (payload.exit_at !== undefined) {
            if (payload.exit_at === null) {
                entity.exit_at = null;
            } else {
                const exit_at = new Date(payload.exit_at);
                if (Number.isNaN(exit_at.getTime())) throw new BadRequestException('Geçersiz çıkış tarihi');

                // Çıkış tarihi giriş tarihinden önce olamaz
                const entryToCheck = payload.entry_at ? new Date(payload.entry_at) : entity.entry_at;
                if (exit_at <= entryToCheck) {
                    throw new BadRequestException('Çıkış tarihi giriş tarihinden sonra olmalıdır');
                }

                entity.exit_at = exit_at;
            }
        }

        if (payload.plate) entity.plate = payload.plate.replace(/\s+/g, '').toUpperCase();
        if (typeof payload.district !== 'undefined') entity.district = payload.district ?? null;
        if (typeof payload.vehicle_type !== 'undefined') entity.vehicle_type = payload.vehicle_type ?? null;
        if (typeof payload.note !== 'undefined') entity.note = payload.note ?? null;

        return this.repo.save(entity);
    }
}
