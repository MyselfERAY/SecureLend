import { Module } from '@nestjs/common';
import { MarketingAgentController } from './marketing-agent.controller';
import { MarketingAgentService } from './marketing-agent.service';

@Module({
  controllers: [MarketingAgentController],
  providers: [MarketingAgentService],
})
export class MarketingAgentModule {}
