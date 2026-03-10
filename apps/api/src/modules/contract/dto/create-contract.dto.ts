import {
  IsString, IsUUID, IsNumber, IsInt, IsOptional,
  IsPositive, Min, Max, MaxLength, Matches, Length,
} from 'class-validator';

export class CreateContractDto {
  @IsUUID('4') propertyId!: string;
  @IsUUID('4') tenantId!: string;

  @IsString({ message: 'Ev sahibi IBAN zorunludur' })
  @Matches(/^TR\d{24}$/, { message: 'IBAN TR ile baslamali ve 26 karakter olmalidir' })
  @Length(26, 26)
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
}
