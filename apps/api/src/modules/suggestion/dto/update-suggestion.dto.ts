import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { SuggestionStatus, SuggestionPriority } from '@prisma/client';

export class UpdateSuggestionDto {
  @IsOptional()
  @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;

  @IsOptional()
  @IsEnum(SuggestionPriority)
  priority?: SuggestionPriority;

  @IsOptional()
  @IsString()
  agentNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  prLink?: string;

}
