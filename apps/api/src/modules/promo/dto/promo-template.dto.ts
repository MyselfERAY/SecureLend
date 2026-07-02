import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PromoType } from '@prisma/client';

export class CreatePromoTemplateDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEnum(PromoType)
  type!: PromoType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent!: number;

  @IsInt()
  @Min(1)
  @Max(120)
  durationMonths!: number;

  @IsOptional()
  @IsBoolean()
  isAutoApply?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  maxUsageCount?: number;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}

// Güncelleme: yalnızca izin verilen alanlar opsiyonel; currentUsage gibi muhasebe
// alanları KASITEN dışarıda bırakıldı (mass-assignment engeli).
export class UpdatePromoTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  durationMonths?: number;

  @IsOptional()
  @IsBoolean()
  isAutoApply?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  maxUsageCount?: number;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}
