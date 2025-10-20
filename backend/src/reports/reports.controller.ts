import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR', 'VIEWER')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  // Returns total/with-vehicle/without-vehicle/active/exited counts for a date range
  @Get('summary')
  summary(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.reports.summary(dateFrom, dateTo);
  }

  // Dashboard overview combining visits and vehicles
  @Get('/dashboard/overview')
  overview(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.reports.dashboardOverview(dateFrom, dateTo);
  }

  // Returns how many visits per company in a date range
  @Get('by-company')
  byCompany(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.reports.byCompany(dateFrom, dateTo);
  }

  // Generates an Excel (.xlsx) file with summary and company sheets
  @Get('export/excel')
  async exportExcel(@Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string, @Res() res: Response) {
    const [s, companies] = await Promise.all([
      this.reports.summary(dateFrom, dateTo),
      this.reports.byCompany(dateFrom, dateTo),
    ]);

    const wb = new ExcelJS.Workbook();
    const wsSummary = wb.addWorksheet('Özet');
    wsSummary.columns = [
      { header: 'Başlık', key: 'k', width: 20 },
      { header: 'Değer', key: 'v', width: 15 },
    ];
    wsSummary.addRows([
      ['Toplam', s.total],
      ['Araçlı', s.withVehicle],
      ['Araçsız', s.withoutVehicle],
      ['Aktif', s.active],
      ['Çıkışlı', s.exited],
    ]);

    const wsCompany = wb.addWorksheet('Firma Bazlı');
    wsCompany.columns = [
      { header: 'Firma', key: 'c', width: 30 },
      { header: 'Adet', key: 'n', width: 10 },
    ];
    wsCompany.addRows(companies.map(c => [c.company, c.count]));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="reports.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  }

  // Generates a PDF file with a simple bar chart and a company table
  @Get('export/pdf')
  async exportPdf(@Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string, @Res() res: Response) {
    const [s, companies] = await Promise.all([
      this.reports.summary(dateFrom, dateTo),
      this.reports.byCompany(dateFrom, dateTo),
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reports.pdf"');

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    // Try to load a font with Turkish glyph support if present under /app/certs/DejaVuSans.ttf
    const candidate = path.join(process.cwd(), 'certs', 'DejaVuSans.ttf');
    if (fs.existsSync(candidate)) {
      doc.font(candidate);
    } else {
      doc.font('Helvetica');
    }

    doc.fontSize(20).text('Ziyaret Raporu', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tarih Aralığı: ${dateFrom || 'Tamammı'} → ${dateTo || 'Tamammı'}`);

    // Bar chart for summary
    const summaryData: [string, number][] = [
      ['Toplam', s.total],
      ['Araçlı', s.withVehicle],
      ['Araçsız', s.withoutVehicle],
      ['Aktif', s.active],
      ['Çıkışlı', s.exited],
    ];
    const startX = 50;
    let y = doc.y + 10;
    const barWidth = 30;
    const gap = 20;
    const maxVal = Math.max(...summaryData.map(([, v]) => v), 1);
    summaryData.forEach(([label, value], idx) => {
      const barHeight = (value / maxVal) * 120;
      const x = startX + idx * (barWidth + gap);
      doc.save().rect(x, y + (120 - barHeight), barWidth, barHeight).fill('#1890ff').restore();
      doc.fontSize(10).text(label, x - 5, y + 130, { width: barWidth + 10, align: 'center' });
      doc.fontSize(10).text(String(value), x - 5, y + (120 - barHeight) - 14, { width: barWidth + 10, align: 'center' });
    });

    doc.addPage();
    doc.fontSize(14).text('Firma Bazlı');
    doc.moveDown();

    const tableTop = doc.y;
    const col1 = 60; const col2 = 400;
    doc.fontSize(12).text('Firma', col1, tableTop, { width: 300 });
    doc.text('Adet', col2, tableTop, { width: 100 });
    let rowY = tableTop + 20;
    companies.forEach((c) => {
      doc.text(c.company, col1, rowY, { width: 300 });
      doc.text(String(c.count), col2, rowY, { width: 100 });
      rowY += 18;
    });

    doc.end();
  }
}
