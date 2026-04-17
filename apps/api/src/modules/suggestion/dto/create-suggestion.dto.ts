import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, Matches } from 'class-validator';
import { SuggestionPriority } from '@prisma/client';

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsEnum(SuggestionPriority)
  priority?: SuggestionPriority;

  /**
   * Deterministic deduplication key. Health Agent gibi periyodik ajanlar ayni
   * hata grubu icin tekrar tekrar Suggestion acmamak icin bu alani doldurur.
   * Format: `<source>:<hash>` (ornek: `health:a3f4e1b2c5d6e7f8`). Manuel admin
   * girislerinde bos birakilir, davranis degismez.
   *
   * Service tarafi:
   *  - Ayni dedupKey ile aktif/rejected kayit varsa mevcut dondurulur
   *  - 48 saat icindeki DONE kayit varsa mevcut dondurulur (rollout penceresi)
   *  - Aksi halde eski eslesen kayitlarin dedupKey'i null'a cekilir ve yeni
   *    kayit acilir (audit trail korunur, dedup tamponu serbest kalir)
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-zA-Z0-9:_\-./]+$/, {
    message: 'dedupKey sadece harf, rakam ve : _ - . / karakterlerini icerebilir',
  })
  dedupKey?: string;
}
