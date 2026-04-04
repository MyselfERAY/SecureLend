import { IsString, IsDateString, Length, Matches, MaxLength, MinLength } from 'class-validator';

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
}
