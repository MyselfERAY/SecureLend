import { IsEnum, IsNumber, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';

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

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Aylik gelir sayi olmalidir' })
  @Min(0, { message: 'Aylik gelir 0 veya uzerinde olmalidir' })
  @Max(10_000_000, { message: 'Aylik gelir cok yuksek' })
  monthlyIncome!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  employerName?: string;

  @IsString({ message: 'Ikamet adresi zorunludur' })
  @MaxLength(500)
  residentialAddress!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Tahmini kira bedeli sayi olmalidir' })
  @Min(1, { message: 'Tahmini kira bedeli en az 1 TL olmalidir' })
  @Max(1_000_000, { message: 'Tahmini kira bedeli cok yuksek' })
  estimatedRent!: number;

  @IsOptional()
  @IsNumber()
  dateOfBirth?: number; // timestamp - for age-based scoring
}
