import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { SuggestionPriority } from '@prisma/client';

export class CreateSuggestionDto {
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
}
