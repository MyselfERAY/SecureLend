import { IsOptional, IsEnum } from 'class-validator';
import {
  PoItemStatus,
  PoItemCategory,
  SuggestionPriority,
} from '@prisma/client';

export class UpdatePoItemDto {
  @IsOptional()
  @IsEnum(PoItemStatus)
  status?: PoItemStatus;

  @IsOptional()
  @IsEnum(SuggestionPriority)
  priority?: SuggestionPriority;

  @IsOptional()
  @IsEnum(PoItemCategory)
  category?: PoItemCategory;
}
