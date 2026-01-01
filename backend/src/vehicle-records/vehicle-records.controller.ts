import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { VehicleRecordsService } from './vehicle-records.service';
import { CreateVehicleRecordDto, AddExitDto } from './dto/create-vehicle-record.dto';
import { UpdateVehicleRecordDto } from './dto/update-vehicle-record.dto';

@Controller('vehicle-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleRecordsController {
    constructor(private readonly service: VehicleRecordsService) { }

    @Get()
    @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')
    list(
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('plate') plate?: string,
        @Query('district') district?: string,
        @Query('vehicleType') vehicleType?: string,
        @Query('hasExit') hasExit?: string,
        @Query('sortKey') sortKey?: string,
        @Query('sortOrder') sortOrder?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ) {
        return this.service.list({
            dateFrom,
            dateTo,
            plate,
            district,
            vehicleType,
            hasExit: typeof hasExit === 'string' ? hasExit === 'true' : undefined,
            sortKey,
            sortOrder,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
        });
    }

    @Post()
    @Roles('ADMIN', 'MANAGER', 'OPERATOR')
    create(@Body() body: CreateVehicleRecordDto) {
        return this.service.createEntry(body as any);
    }

    @Patch(':id/exit')
    @Roles('ADMIN', 'MANAGER', 'OPERATOR')
    addExit(@Param('id') id: string, @Body() body: AddExitDto) {
        return this.service.addExit(id, body.exit_at, body.exit_vehicle_status);
    }

    @Patch(':id')
    @Roles('ADMIN', 'MANAGER')
    update(@Param('id') id: string, @Body() body: UpdateVehicleRecordDto) {
        return this.service.update(id, body as any);
    }
}
