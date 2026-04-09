import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { PoItemCategory, SuggestionPriority } from '@prisma/client';

export class CreatePoItemDto {
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
