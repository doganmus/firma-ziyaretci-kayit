import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Response } from 'express';
import * as client from 'prom-client';

// Initialize default metrics once at startup
const defaultRegistry = client.register;
client.collectDefaultMetrics({ register: defaultRegistry, prefix: 'backend_' });

@Controller()
export class MetricsController {
  // Optionally require ADMIN token in production; keep open in dev for Prometheus
  @Get('metrics')
  @UseGuards(process.env.NODE_ENV === 'production' ? (JwtAuthGuard as any) : (undefined as any))
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', defaultRegistry.contentType);
    const metrics = await defaultRegistry.metrics();
    res.send(metrics);
  }
}


