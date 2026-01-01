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
        if (filters?.dateFrom) qb.andWhere('(e.entry_at >= :df OR e.exit_at >= :df)', { df: new Date(filters.dateFrom) });
        if (filters?.dateTo) qb.andWhere('(e.entry_at <= :dt OR e.exit_at <= :dt)', { dt: new Date(filters.dateTo) });
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
        qb.orderBy(`e.${sortKey}`, sortOrder as 'ASC' | 'DESC', 'NULLS LAST');

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

    // Giriş/Çıkış kaydı oluştur
    async createEntry(payload: {
        entry_at?: string;
        exit_at?: string;
        plate: string;
        district?: string | null;
        vehicle_type?: string | null;
        entry_vehicle_status?: string | null;
        exit_vehicle_status?: string | null;
        note?: string | null;
    }): Promise<VehicleRecord> {
        const normalizedPlate = (payload.plate ?? '').replace(/\s+/g, '').toUpperCase();

        let entry_at: Date | null = null;
        let exit_at: Date | null = null;
        let date: string | null = null;

        // Giriş tarihi işle
        if (payload.entry_at) {
            entry_at = new Date(payload.entry_at);
            if (Number.isNaN(entry_at.getTime())) throw new BadRequestException('Geçersiz giriş tarihi');
            date = entry_at.toISOString().slice(0, 10);
        }

        // Çıkış tarihi işle
        if (payload.exit_at) {
            exit_at = new Date(payload.exit_at);
            if (Number.isNaN(exit_at.getTime())) throw new BadRequestException('Geçersiz çıkış tarihi');

            // Eğer hem giriş hem çıkış varsa, çıkış > giriş olmalı
            if (entry_at && exit_at <= entry_at) {
                throw new BadRequestException('Çıkış tarihi giriş tarihinden sonra olmalıdır');
            }

            // Eğer sadece çıkış varsa, date = çıkış tarihi
            if (!date) {
                date = exit_at.toISOString().slice(0, 10);
            }
        }

        // En az bir tarih olmalı
        if (!entry_at && !exit_at) {
            throw new BadRequestException('En az giriş veya çıkış tarihi girilmelidir');
        }

        const entity = this.repo.create({
            entry_at,
            exit_at,
            date,
            plate: normalizedPlate,
            district: payload.district ?? null,
            vehicle_type: payload.vehicle_type ?? null,
            entry_vehicle_status: payload.entry_vehicle_status ?? null,
            exit_vehicle_status: payload.exit_vehicle_status ?? null,
            note: payload.note ?? null,
        });
        return this.repo.save(entity);
    }

    // Çıkış kaydı ekle (mevcut kayda)
    async addExit(id: string, exit_at: string, exit_vehicle_status?: string | null): Promise<VehicleRecord> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new BadRequestException('Kayıt bulunamadı');

        // Eğer sadece çıkış kaydıysa (entry_at null), tekrar çıkış eklenemez
        if (entity.entry_at === null) {
            throw new BadRequestException('Bu kayıt sadece çıkış kaydıdır, tekrar çıkış eklenemez');
        }

        // Zaten çıkış yapılmışsa hata ver
        if (entity.exit_at !== null) {
            throw new BadRequestException('Bu kayıt için çıkış zaten yapılmış');
        }

        const exitDate = new Date(exit_at);
        if (Number.isNaN(exitDate.getTime())) throw new BadRequestException('Geçersiz çıkış tarihi');

        // Çıkış tarihi giriş tarihinden önce olamaz
        if (exitDate <= entity.entry_at) {
            throw new BadRequestException('Çıkış tarihi giriş tarihinden sonra olmalıdır');
        }

        entity.exit_at = exitDate;
        if (typeof exit_vehicle_status !== 'undefined') {
            entity.exit_vehicle_status = exit_vehicle_status ?? null;
        }
        return this.repo.save(entity);
    }

    // Kayıt güncelle
    async update(id: string, payload: Partial<{
        entry_at: string | null;
        exit_at: string | null;
        plate: string;
        district?: string | null;
        vehicle_type?: string | null;
        entry_vehicle_status?: string | null;
        exit_vehicle_status?: string | null;
        note?: string | null;
    }>): Promise<VehicleRecord> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new BadRequestException('Kayıt bulunamadı');

        if (payload.entry_at !== undefined) {
            if (payload.entry_at === null) {
                entity.entry_at = null;
                entity.date = null;
            } else {
                const entry_at = new Date(payload.entry_at);
                if (Number.isNaN(entry_at.getTime())) throw new BadRequestException('Geçersiz giriş tarihi');
                entity.entry_at = entry_at;
                entity.date = entry_at.toISOString().slice(0, 10);
            }
        }

        if (payload.exit_at !== undefined) {
            if (payload.exit_at === null) {
                entity.exit_at = null;
            } else {
                const exit_at = new Date(payload.exit_at);
                if (Number.isNaN(exit_at.getTime())) throw new BadRequestException('Geçersiz çıkış tarihi');

                // Çıkış tarihi giriş tarihinden önce olamaz
                const entryToCheck = payload.entry_at !== undefined
                    ? (payload.entry_at ? new Date(payload.entry_at) : null)
                    : entity.entry_at;

                if (entryToCheck && exit_at <= entryToCheck) {
                    throw new BadRequestException('Çıkış tarihi giriş tarihinden sonra olmalıdır');
                }

                entity.exit_at = exit_at;

                // Eğer sadece çıkış varsa date'i güncelle
                if (!entity.entry_at && !entity.date) {
                    entity.date = exit_at.toISOString().slice(0, 10);
                }
            }
        }

        if (payload.plate) entity.plate = payload.plate.replace(/\s+/g, '').toUpperCase();
        if (typeof payload.district !== 'undefined') entity.district = payload.district ?? null;
        if (typeof payload.vehicle_type !== 'undefined') entity.vehicle_type = payload.vehicle_type ?? null;
        if (typeof payload.entry_vehicle_status !== 'undefined') entity.entry_vehicle_status = payload.entry_vehicle_status ?? null;
        if (typeof payload.exit_vehicle_status !== 'undefined') entity.exit_vehicle_status = payload.exit_vehicle_status ?? null;
        if (typeof payload.note !== 'undefined') entity.note = payload.note ?? null;

        return this.repo.save(entity);
    }
}

