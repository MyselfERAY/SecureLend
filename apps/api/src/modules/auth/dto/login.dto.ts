import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(11, 11, { message: 'TCKN 11 haneli olmalidir' })
  @Matches(/^\d+$/, { message: 'TCKN sadece rakam icermelidir' })
  tckn!: string;

  @IsString()
  @Matches(/^5\d{9}$/, { message: 'Gecerli bir telefon numarasi girin' })
  phone!: string;
}
