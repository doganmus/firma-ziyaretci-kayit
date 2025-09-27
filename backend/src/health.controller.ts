import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  // Simple health endpoint used by monitors/load balancers
  @Get('/health')
  getHealth() {
    return { status: 'ok' };
  }
}
