import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleRecord } from './vehicle-record.entity';
import { VehicleRecordsService } from './vehicle-records.service';
import { VehicleRecordsController } from './vehicle-records.controller';

@Module({
    imports: [TypeOrmModule.forFeature([VehicleRecord])],
    controllers: [VehicleRecordsController],
    providers: [VehicleRecordsService],
    exports: [VehicleRecordsService],
})
export class VehicleRecordsModule { }
