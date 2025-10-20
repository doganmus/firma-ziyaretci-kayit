import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleLog } from './vehicle-log.entity';
import { VehicleLogsService } from './vehicle-logs.service';
import { VehicleLogsController } from './vehicle-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleLog])],
  controllers: [VehicleLogsController],
  providers: [VehicleLogsService],
})
export class VehicleLogsModule {}


