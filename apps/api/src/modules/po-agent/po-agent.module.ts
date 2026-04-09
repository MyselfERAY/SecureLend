import { Module } from '@nestjs/common';
import { PoAgentController } from './po-agent.controller';
import { PoAgentService } from './po-agent.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PoAgentController],
  providers: [PoAgentService],
})
export class PoAgentModule {}
