import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from '../settings/settings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from '../audit/audit.entity';
import * as http from 'http';

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

  @Post('nginx/reload')
  async reloadNginx() {
    // Requires docker.sock mounted. Call Docker API over unix socket.
    const socketPath = '/var/run/docker.sock'
    const request = (method: string, path: string, body?: any) => new Promise<any>((resolve, reject) => {
      const data = body ? Buffer.from(JSON.stringify(body)) : undefined
      const req = http.request({ socketPath, path, method, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : undefined }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
        res.on('end', () => {
          const txt = Buffer.concat(chunks).toString('utf8')
          try { resolve(txt ? JSON.parse(txt) : {}) } catch { resolve({}) }
        })
      })
      req.on('error', reject)
      if (data) req.write(data)
      req.end()
    })

    // Find running frontend container
    const filters = encodeURIComponent(JSON.stringify({ label: ['com.docker.compose.service=frontend'] }))
    const list: any[] = await request('GET', `/containers/json?filters=${filters}`)
    const container = Array.isArray(list) && list.length > 0 ? list[0] : null
    if (!container?.Id) throw new Error('Frontend container bulunamadı')

    // Create exec instance
    const execCreate = await request('POST', `/containers/${container.Id}/exec`, {
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ['nginx', '-s', 'reload'],
    })
    if (!execCreate?.Id) throw new Error('Docker exec oluşturulamadı')
    // Start exec
    await request('POST', `/exec/${execCreate.Id}/start`, { Detach: false })
    return { ok: true }
  }
}


