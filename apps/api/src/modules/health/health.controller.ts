import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@SkipThrottle()
@Public()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'success',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
