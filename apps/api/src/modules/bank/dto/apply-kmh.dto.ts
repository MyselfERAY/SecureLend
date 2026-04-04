import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export enum EmploymentStatusDto {
  EMPLOYED = 'EMPLOYED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  RETIRED = 'RETIRED',
  STUDENT = 'STUDENT',
  UNEMPLOYED = 'UNEMPLOYED',
}

export class ApplyKmhDto {
  @IsEnum(EmploymentStatusDto, { message: 'Gecerli bir calisma durumu secin' })
  employmentStatus!: EmploymentStatusDto;

  @IsNumber({}, { message: 'Aylik gelir sayi olmalidir' })
  @Min(0, { message: 'Aylik gelir 0 veya uzerinde olmalidir' })
  monthlyIncome!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  employerName?: string;

  @IsString({ message: 'Ikamet adresi zorunludur' })
  @MaxLength(500)
  residentialAddress!: string;

  @IsNumber({}, { message: 'Tahmini kira bedeli sayi olmalidir' })
  @Min(1, { message: 'Tahmini kira bedeli en az 1 TL olmalidir' })
  estimatedRent!: number;

  @IsOptional()
  @IsNumber()
  dateOfBirth?: number; // timestamp - for age-based scoring

  @IsOptional()
  @IsNumber()
  existingDebtPayments?: number; // monthly debt payments for DTI calculation

  @IsOptional()
  @IsBoolean()
  existingBankCustomer?: boolean; // skip extended KYC if true
}
