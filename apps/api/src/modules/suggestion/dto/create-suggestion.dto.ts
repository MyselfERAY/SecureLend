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
   * Deterministic deduplication key. Ayni hata icin tekrar tekrar Suggestion
   * yaratilmasini onler. Genellikle `<source>:<hash>` formatinda verilir
   * (ornek: `health:a3f4e1b2c5d6e7f8`). Manuel admin girislerinde bos birakilir.
   *
   * - Ayni dedupKey ile aktif (PENDING/IN_PROGRESS) bir Suggestion varsa
   *   service yeni kayit olusturmaz, mevcut kaydi dondurur.
   * - DONE statusundeki eski kayit 48 saatten yeniyse de dondurulur
   *   (fix deploy'u beklenirken ayni hata listesinde gorunebilir).
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-zA-Z0-9:_\-./]+$/, {
    message: 'dedupKey sadece harf, rakam ve : _ - . / karakterlerini icerebilir',
  })
  dedupKey?: string;
}
