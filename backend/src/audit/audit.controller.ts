import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';
import { QueryAuditDto } from './dto/query-audit.dto';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  @Get()
  async list(@Query() q: QueryAuditDto) {
    const qb = this.repo.createQueryBuilder('a');
    if (q.dateFrom) qb.andWhere('a.createdAt >= :df', { df: new Date(q.dateFrom) });
    if (q.dateTo) qb.andWhere('a.createdAt <= :dt', { dt: new Date(q.dateTo) });
    if (q.method) qb.andWhere('a.method = :m', { m: q.method });
    if (typeof q.statusFrom === 'number') qb.andWhere('a.statusCode >= :sf', { sf: q.statusFrom });
    if (typeof q.statusTo === 'number') qb.andWhere('a.statusCode <= :st', { st: q.statusTo });
    if (q.path) qb.andWhere('a.path ILIKE :p', { p: `%${q.path}%` });
    if (q.userEmail) qb.andWhere('a.userEmail ILIKE :ue', { ue: `%${q.userEmail}%` });
    if (q.userId) qb.andWhere('a.userId = :uid', { uid: q.userId });

    const sortKey = q.sortKey || 'createdAt';
    const sortOrder = q.sortOrder === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy(`a.${sortKey}`, sortOrder as any);

    const page = Math.max(1, Number(q.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(q.pageSize || 10)));
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}


