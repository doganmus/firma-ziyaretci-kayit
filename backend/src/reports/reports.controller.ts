import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
}
