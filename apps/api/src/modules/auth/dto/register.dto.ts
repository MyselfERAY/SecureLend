import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
  MinLength,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsentType } from '@prisma/client';

export class ConsentItemDto {
  @IsEnum(ConsentType, { message: 'Gecerli bir onay tipi secin' })
  type!: ConsentType;

  @IsString()
  @MaxLength(10, { message: 'Versiyon en fazla 10 karakter olmali' })
  version!: string;
}

export class RegisterDto {
  @IsString()
  @Length(11, 11, { message: 'TCKN 11 haneli olmalidir' })
  @Matches(/^\d+$/, { message: 'TCKN sadece rakam icermelidir' })
  tckn!: string;

  @IsString()
  @Matches(/^5\d{9}$/, { message: 'Gecerli bir telefon numarasi girin (5XXXXXXXXX)' })
  phone!: string;

  @IsString()
  @MinLength(3, { message: 'Ad soyad en az 3 karakter olmali' })
  @MaxLength(200)
  fullName!: string;

  @IsDateString({}, { message: 'Gecerli bir dogum tarihi girin (YYYY-MM-DD)' })
  dateOfBirth!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsentItemDto)
  consents?: ConsentItemDto[];
}
