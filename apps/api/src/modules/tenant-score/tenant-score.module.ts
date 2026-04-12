import { Module } from '@nestjs/common';
import { TenantScoreService } from './tenant-score.service';
import { TenantScoreController } from './tenant-score.controller';

@Module({
  controllers: [TenantScoreController],
  providers: [TenantScoreService],
  exports: [TenantScoreService],
})
export class TenantScoreModule {}
