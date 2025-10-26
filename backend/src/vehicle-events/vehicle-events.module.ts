import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleEvent } from './vehicle-event.entity';
import { VehicleEventsService } from './vehicle-events.service';
import { VehicleEventsController } from './vehicle-events.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleEvent])],
  controllers: [VehicleEventsController],
  providers: [VehicleEventsService],
})
export class VehicleEventsModule {}


