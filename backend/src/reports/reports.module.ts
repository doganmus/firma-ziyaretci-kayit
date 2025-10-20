import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from '../visits/visit.entity';
import { VehicleLog } from '../vehicle-logs/vehicle-log.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

// Reports module provides summary, company breakdown, and export endpoints
@Module({
  imports: [TypeOrmModule.forFeature([Visit, VehicleLog])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
