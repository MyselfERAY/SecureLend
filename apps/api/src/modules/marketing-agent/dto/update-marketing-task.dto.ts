import { IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { MarketingTaskStatus } from '@prisma/client';

export class UpdateMarketingTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsible?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsEnum(MarketingTaskStatus)
  status?: MarketingTaskStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
