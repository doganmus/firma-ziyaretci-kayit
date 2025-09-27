import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as client from 'prom-client';

// Initialize default metrics once at startup
const defaultRegistry = client.register;
client.collectDefaultMetrics({ register: defaultRegistry, prefix: 'backend_' });

@Controller()
export class MetricsController {
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', defaultRegistry.contentType);
    const metrics = await defaultRegistry.metrics();
    res.send(metrics);
  }
}


