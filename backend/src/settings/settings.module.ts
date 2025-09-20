import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService, TypeOrmModule],
})
export class SettingsModule {}


