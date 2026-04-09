import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MarketingReportType } from '@prisma/client';

class MarketingTaskItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateMarketingReportDto {
  @IsEnum(MarketingReportType)
  type: MarketingReportType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsDateString()
  reportDate?: string;

  @IsOptional()
  @IsUUID()
  agentRunId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarketingTaskItemDto)
  tasks?: MarketingTaskItemDto[];
}
