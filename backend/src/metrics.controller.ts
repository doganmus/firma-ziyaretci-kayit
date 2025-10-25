import { CanActivate, Controller, ExecutionContext, Get, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Response } from 'express';
import * as client from 'prom-client';

// Initialize default metrics once at startup
const defaultRegistry = client.register;
client.collectDefaultMetrics({ register: defaultRegistry, prefix: 'backend_' });

// Use JWT guard in production; in dev use a permissive guard to avoid decorator errors
class DevPassGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
const OptionalJwtGuard: any = process.env.NODE_ENV === 'production' ? JwtAuthGuard : DevPassGuard;

@Controller()
export class MetricsController {
  // Optionally require ADMIN token in production; keep open in dev for Prometheus
  @Get('metrics')
  @UseGuards(OptionalJwtGuard)
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', defaultRegistry.contentType);
    const metrics = await defaultRegistry.metrics();
    res.send(metrics);
  }
}


