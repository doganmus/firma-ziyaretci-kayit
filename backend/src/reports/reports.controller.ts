import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Response } from 'express';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR', 'VIEWER')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  summary(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.reports.summary(dateFrom, dateTo);
  }

  @Get('by-company')
  byCompany(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.reports.byCompany(dateFrom, dateTo);
  }

  @Get('export/pdf')
  async exportPdf(@Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string, @Res() res: Response) {
    // For now, generate a CSV content but keep endpoint for client compatibility.
    // In production, integrate a real PDF generator (e.g., pdfkit) here.
    const s = await this.reports.summary(dateFrom, dateTo);
    const by = await this.reports.byCompany(dateFrom, dateTo);
    const rows = [
      ['Toplam', String(s.total)],
      ['Araçlı', String(s.withVehicle)],
      ['Araçsız', String(s.withoutVehicle)],
      ['Aktif', String(s.active)],
      ['Çıkışlı', String(s.exited)],
      [],
      ['Firma', 'Adet'],
      ...by.map((r) => [r.company, String(r.count)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reports.csv"');
    res.end(csv);
  }
}
