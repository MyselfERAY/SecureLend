import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { AgentRunStatus } from '@prisma/client';

export class UpdateAgentRunDto {
  @IsOptional()
  @IsEnum(AgentRunStatus)
  status?: AgentRunStatus;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokenUsage?: number;
}
