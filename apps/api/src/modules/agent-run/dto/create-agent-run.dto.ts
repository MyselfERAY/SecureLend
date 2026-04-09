import { IsEnum } from 'class-validator';
import { AgentType } from '@prisma/client';

export class CreateAgentRunDto {
  @IsEnum(AgentType)
  agentType: AgentType;
}
