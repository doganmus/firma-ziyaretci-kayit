import { Module, MiddlewareConsumer, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VisitsModule } from './visits/visits.module';
import { ReportsModule } from './reports/reports.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { SettingsModule } from './settings/settings.module';
import { UsersService } from './users/users.service';
import { UserRole } from './users/user.entity';
import * as bcrypt from 'bcrypt';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    UsersModule,
    AuthModule,
    VisitsModule,
    ReportsModule,
    SettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly usersService: UsersService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }

  async onApplicationBootstrap() {
    // Bootstrap default ADMIN user if database is empty
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
