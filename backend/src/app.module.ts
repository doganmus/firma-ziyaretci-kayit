import { Module, MiddlewareConsumer, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VisitsModule } from './visits/visits.module';
import { ReportsModule } from './reports/reports.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/audit.interceptor';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { SettingsModule } from './settings/settings.module';
import { OpsModule } from './ops/ops.module';
import { UsersService } from './users/users.service';
import { VehicleLogsModule } from './vehicle-logs/vehicle-logs.module';
import { UserRole } from './users/user.entity';
import * as bcrypt from 'bcrypt';

// Root module that wires up database, rate limiting, and feature modules
@Module({
  imports: [
    // Connect to PostgreSQL using DATABASE_URL; auto loads entity metadata
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      // Prod'da migrations; local'de senkronizasyon açılabilir
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    // Basic rate limiting: up to 120 requests per minute per client
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    UsersModule,
    AuthModule,
    VisitsModule,
    ReportsModule,
    SettingsModule,
    AuditModule,
    OpsModule,
    VehicleLogsModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    // Global rate limiting guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global audit interceptor (lightweight, sadece metadata)
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly usersService: UsersService) {}

  configure(consumer: MiddlewareConsumer) {
    // Log each request with a unique request id and timing
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }

  async onApplicationBootstrap() {
    // Create a default ADMIN user on first run if the database is empty
    try {
      const users = await this.usersService.findAll();
      if (users.length === 0) {
        const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
        const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
        const fullName = process.env.SEED_ADMIN_NAME || 'Admin';
        const password_hash = await bcrypt.hash(password, 10);
        await this.usersService.create({
          email,
          password_hash,
          full_name: fullName,
          role: 'ADMIN' as UserRole,
        });
        // eslint-disable-next-line no-console
        console.log(`[bootstrap] Created default ADMIN user: ${email}`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[bootstrap] Failed to bootstrap default admin user:', err);
    }
  }
}
