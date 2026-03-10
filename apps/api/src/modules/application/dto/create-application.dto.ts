import { IsString, Length, Matches } from 'class-validator';

export class CreateApplicationDto {
  @IsString({ message: 'TCKN bir metin olmalıdır' })
  @Length(11, 11, { message: 'TCKN 11 haneli olmalıdır' })
  @Matches(/^\d+$/, { message: 'TCKN sadece rakam içermelidir' })
  tckn!: string;
}
