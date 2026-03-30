import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  private totalRequests = 0;

  @Get()
  @Public()
  getHealth() {
    this.totalRequests++;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      totalRequests: this.totalRequests
    };
  }
}