import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return {
      status: 'success',
      data: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
