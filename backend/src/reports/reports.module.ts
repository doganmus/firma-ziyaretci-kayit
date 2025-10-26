import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from '../visits/visit.entity';
import { VehicleLog } from '../vehicle-logs/vehicle-log.entity';
import { ReportsService } from './reports.service';
import { VehicleEvent } from '../vehicle-events/vehicle-event.entity';
import { ReportsController } from './reports.controller';

// Reports module provides summary, company breakdown, and export endpoints
@Module({
  imports: [TypeOrmModule.forFeature([Visit, VehicleLog, VehicleEvent])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
