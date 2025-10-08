import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from '../settings/settings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from '../audit/audit.entity';

@Controller('admin/ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class OpsController {
  constructor(
    private readonly settingsService: SettingsService,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
  ) {}

  @Get('status')
  status() {
    return {
      uptimeSec: Math.round(process.uptime()),
      node: process.version,
      env: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.0.0',
    };
  }

  @Post('maintenance/enable')
  async enableMaintenance() {
    return this.settingsService.update({ maintenanceMode: true });
  }

  @Post('maintenance/disable')
  async disableMaintenance() {
    return this.settingsService.update({ maintenanceMode: false });
  }

  @Post('audit/cleanup')
  async cleanupAudit(@Body() body: { olderThanDays?: number }) {
    const days = Math.max(1, Math.floor(Number(body?.olderThanDays || 30)));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const res = await this.auditRepo.delete({ createdAt: LessThan(cutoff) });
    return { deleted: res.affected || 0, olderThanDays: days };
  }
}


