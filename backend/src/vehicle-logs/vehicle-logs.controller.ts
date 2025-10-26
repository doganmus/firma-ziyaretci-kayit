import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { VehicleLogsService } from './vehicle-logs.service';
import { CreateVehicleLogDto } from './dto/create-vehicle-log.dto';

@Controller('vehicle-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleLogsController {
  constructor(private readonly vehicleLogs: VehicleLogsService) {}

  @Get()
  @Roles('ADMIN', 'OPERATOR', 'VIEWER')
  list(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('plate') plate?: string,
    @Query('active') active?: string,
    @Query('district') district?: string,
    @Query('vehicleType') vehicleType?: string,
    @Query('sortKey') sortKey?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.vehicleLogs.list({
      dateFrom,
      dateTo,
      plate,
      active: typeof active === 'string' ? active === 'true' : undefined,
      district,
      vehicleType,
      sortKey,
      sortOrder,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  create(@Body() body: CreateVehicleLogDto) {
    return this.vehicleLogs.create(body as any);
  }

  // Çıkış akışı olay-temelli modele taşındı; bu uç kaldırıldı
}


