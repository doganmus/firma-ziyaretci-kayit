import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { VehicleEventsService } from './vehicle-events.service';
import { CreateVehicleEventDto } from './dto/create-vehicle-event.dto';
import { UpdateVehicleEventDto } from './dto/update-vehicle-event.dto';

@Controller('vehicle-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleEventsController {
  constructor(private readonly service: VehicleEventsService) {}

  @Get()
  @Roles('ADMIN', 'OPERATOR', 'VIEWER')
  list(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('plate') plate?: string,
    @Query('action') action?: 'ENTRY' | 'EXIT',
    @Query('district') district?: string,
    @Query('vehicleType') vehicleType?: string,
    @Query('active') active?: string,
    @Query('sortKey') sortKey?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.list({
      dateFrom,
      dateTo,
      plate,
      action,
      district,
      vehicleType,
      active: typeof active === 'string' ? active === 'true' : undefined,
      sortKey,
      sortOrder,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  create(@Body() body: CreateVehicleEventDto) {
    return this.service.create(body as any);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  update(@Param('id') id: string, @Body() body: UpdateVehicleEventDto) {
    return this.service.update(id, body as any);
  }

  @Get('districts')
  @Roles('ADMIN', 'OPERATOR', 'VIEWER')
  getDistricts() {
    const istanbulDistricts = [
      'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir',
      'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy',
      'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
      'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli',
      'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'
    ];
    const kocaeliDistricts = [
      'Başiskele', 'Çayırova', 'Darıca', 'Derince', 'Dilovası', 'Gebze', 'Gölcük', 'İzmit', 'Kandıra', 'Karamürsel', 'Kartepe', 'Körfez'
    ];
    return { data: [...istanbulDistricts, ...kocaeliDistricts].sort() };
  }
}


