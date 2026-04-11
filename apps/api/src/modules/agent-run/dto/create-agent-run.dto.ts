import { IsIn } from 'class-validator';
import { AgentType } from '@prisma/client';

// Includes HEALTH and ARTICLE which are added via SQL migration (not yet in generated Prisma enum)
const ALL_AGENT_TYPES = ['PO', 'MARKETING', 'DEV', 'HEALTH', 'ARTICLE'] as const;

export class CreateAgentRunDto {
  @IsIn(ALL_AGENT_TYPES)
  agentType!: AgentType | 'HEALTH' | 'ARTICLE';
}
