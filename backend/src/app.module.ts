import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { User } from './users/user.entity';
import { Visit } from './visits/visit.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VisitsModule } from './visits/visits.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    VisitsModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
