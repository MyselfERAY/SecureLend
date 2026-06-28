import { IsString, MaxLength, MinLength } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @MinLength(1, { message: 'Fotograf verisi bos' })
  // 5MB ikili ≈ 6.8MB base64 — gövde decode edilmeden pipe seviyesinde reddedilir
  @MaxLength(7_000_000, { message: 'Fotograf cok buyuk (max 5MB)' })
  photoBase64!: string;
}
