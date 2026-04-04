import { IsEnum, IsString, MaxLength } from 'class-validator';
import { ConsentType } from '@prisma/client';

export class RecordConsentDto {
  @IsEnum(ConsentType, { message: 'Gecerli bir onay tipi secin' })
  type!: ConsentType;

  @IsString()
  @MaxLength(10, { message: 'Versiyon en fazla 10 karakter olmali' })
  version!: string;
}
