import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^5\d{9}$/, { message: 'Gecerli bir telefon numarasi girin' })
  phone!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP 6 haneli olmalidir' })
  @Matches(/^\d+$/, { message: 'OTP sadece rakam icermelidir' })
  code!: string;
}
