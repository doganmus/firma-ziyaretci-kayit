import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpsController } from './ops.controller';
import { CertController } from './cert.controller';
import { SettingsModule } from '../settings/settings.module';
import { AuditLog } from '../audit/audit.entity';

@Module({
  imports: [SettingsModule, TypeOrmModule.forFeature([AuditLog])],
  controllers: [OpsController, CertController],
})
export class OpsModule {}


