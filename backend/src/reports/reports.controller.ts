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
    // Basit PDF: PDFKit yerine minimal binary (placeholder). Gerçekte PDFKit kullanılması önerilir.
    const data = await this.reports.summary(dateFrom, dateTo);
    const content = `Summary\\nTotal: ${data.total}\\nWith Vehicle: ${data.withVehicle}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="summary.pdf"');
    // Minimal PDF header/body (placeholder). Üretimde pdfkit ile gerçek PDF üretin.
    const pdf = Buffer.from(`%PDF-1.1\n1 0 obj<<>>endobj\n2 0 obj<< /Length ${content.length + 73} >>stream\nBT /F1 12 Tf 72 720 Td (${content}) Tj ET\nendstream\nendobj\n3 0 obj<< /Type /Page /Parent 4 0 R /Contents 2 0 R >>endobj\n4 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n5 0 obj<< /Type /Catalog /Pages 4 0 R >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000200 00000 n \n0000000270 00000 n \n0000000333 00000 n \ntrailer<< /Size 6 /Root 5 0 R >>\nstartxref\n400\n%%EOF`);
    res.end(pdf);
  }
}
