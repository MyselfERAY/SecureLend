import {
  IsString, IsUUID, IsNumber, IsInt, IsOptional,
  IsPositive, Min, Max, MaxLength, Matches,
  IsEnum, IsBoolean,
} from 'class-validator';
import { RentIncreaseType } from '@prisma/client';
import { IsTurkishIban } from '../../../common/validators/iban.validator';

export class CreateContractDto {
  @IsUUID('4') propertyId!: string;
  @IsUUID('4') tenantId!: string;

  @IsTurkishIban({ message: 'Gecerli bir Turk IBAN giriniz (TR ile baslamali, 26 karakter, mod97 kontrolu)' })
  landlordIban!: string;

  @IsNumber() @IsPositive()
  monthlyRent!: number;

  @IsOptional() @IsNumber() @IsPositive()
  depositAmount?: number;

  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Tarih YYYY-MM-DD formatinda olmali' })
  startDate!: string;

  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Tarih YYYY-MM-DD formatinda olmali' })
  endDate!: string;

  @IsInt() @Min(1) @Max(28)
  paymentDayOfMonth!: number;

  @IsOptional() @IsString() @MaxLength(5000)
  terms?: string;

  @IsOptional() @IsString() @MaxLength(5000)
  specialClauses?: string;

  @IsOptional()
  @IsEnum(RentIncreaseType)
  rentIncreaseType?: RentIncreaseType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rentIncreaseRate?: number;

  @IsOptional()
  @IsBoolean()
  furnitureIncluded?: boolean;

  @IsOptional()
  @IsBoolean()
  petsAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  sublettingAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  noticePeriodDays?: number;
}
