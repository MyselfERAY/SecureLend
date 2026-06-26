import { IsString, Length, Matches } from 'class-validator';

export class StartApplicationDto {
  @IsString({ message: 'TCKN bir metin olmalıdır' })
  @Length(11, 11, { message: 'TCKN 11 haneli olmalıdır' })
  @Matches(/^\d+$/, { message: 'TCKN sadece rakam içermelidir' })
  tckn!: string;

  @IsString()
  @Matches(/^5\d{9}$/, { message: 'Geçerli bir telefon numarası girin' })
  phone!: string;
}
