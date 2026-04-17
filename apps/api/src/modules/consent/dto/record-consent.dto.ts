import { IsIn, IsString, MaxLength } from 'class-validator';
import { ConsentType } from '@prisma/client';

// Includes 6502 TKHK / Mesafeli Sozlesmeler Yonetmeligi consent types added via migration.
// These values exist in the DB but are not yet in the Prisma-generated enum since schema.prisma
// cannot be modified without a migration. After migration runs, Prisma accepts them at runtime.
export const EXTENDED_CONSENT_TYPES = [
  ...Object.values(ConsentType),
  'ON_BILGILENDIRME_FORMU',
  'CAYMA_HAKKI_TEYIDI',
];

export class RecordConsentDto {
  @IsIn(EXTENDED_CONSENT_TYPES, { message: 'Gecerli bir onay tipi secin' })
  type!: ConsentType;

  @IsString()
  @MaxLength(10, { message: 'Versiyon en fazla 10 karakter olmali' })
  version!: string;
}
