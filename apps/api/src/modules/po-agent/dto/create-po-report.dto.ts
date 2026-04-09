import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PoItemCategory, SuggestionPriority } from '@prisma/client';

export class CreatePoReportItemDto {
  @IsEnum(PoItemCategory)
  category: PoItemCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsEnum(SuggestionPriority)
  priority?: SuggestionPriority;

  @IsOptional()
  @IsBoolean()
  isDevTask?: boolean;
}

export class CreatePoReportDto {
  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsOptional()
  @IsObject()
  metricsSnapshot?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  agentRunId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoReportItemDto)
  items: CreatePoReportItemDto[];
}
