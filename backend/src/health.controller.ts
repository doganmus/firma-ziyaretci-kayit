import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller()
export class HealthController {
  private readonly startTime = Date.now();
  private readonly version: string;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    // Read version from package.json
    try {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf8')
      );
      this.version = packageJson.version || 'unknown';
    } catch {
      this.version = 'unknown';
    }
  }

  /**
   * Simple health check endpoint for load balancers and monitoring.
   * Returns basic status without database check for fast response.
   */
  @Get('/health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
    };
  }

  /**
   * Detailed health check endpoint with database connectivity check.
   * Use this for comprehensive health monitoring.
   */
  @Get('/health/detailed')
  async getDetailedHealth() {
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      database: {
        status: 'unknown',
        responseTime: null as number | null,
      },
    };

    // Check database connectivity
    try {
      const dbStart = Date.now();
      await this.dataSource.query('SELECT 1');
      const dbResponseTime = Date.now() - dbStart;
      
      health.database = {
        status: 'ok',
        responseTime: dbResponseTime,
      };
    } catch (error) {
      health.database = {
        status: 'down',
        responseTime: null,
      };
      health.status = 'degraded';
    }

    // Determine overall status
    if (health.database.status === 'down') {
      health.status = 'down';
    }

    return health;
  }
}
