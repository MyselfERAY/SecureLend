import {
  IsString, IsNumber, IsOptional, IsInt, IsEnum,
  MaxLength, MinLength, Min, Max, IsPositive, Matches,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString({ message: 'Baslik metin olmali' })
  @MinLength(5, { message: 'Baslik en az 5 karakter olmali' })
  @MaxLength(200, { message: 'Baslik en fazla 200 karakter olmali' })
  title!: string;

  @IsString({ message: 'Adres metin olmali' })
  @MinLength(3, { message: 'Adres en az 3 karakter olmali' })
  @MaxLength(300, { message: 'Adres en fazla 300 karakter olmali' })
  addressLine1!: string;

  @IsOptional()
  @IsString({ message: 'Adres satiri 2 metin olmali' })
  @MaxLength(300, { message: 'Adres satiri 2 en fazla 300 karakter olmali' })
  addressLine2?: string;

  @IsString({ message: 'Sehir metin olmali' })
  @MinLength(2, { message: 'Sehir en az 2 karakter olmali' })
  @MaxLength(100, { message: 'Sehir en fazla 100 karakter olmali' })
  city!: string;

  @IsString({ message: 'Ilce metin olmali' })
  @MinLength(2, { message: 'Ilce en az 2 karakter olmali' })
  @MaxLength(100, { message: 'Ilce en fazla 100 karakter olmali' })
  district!: string;

  @IsOptional()
  @IsString({ message: 'Mahalle metin olmali' })
  @MaxLength(200, { message: 'Mahalle en fazla 200 karakter olmali' })
  neighborhood?: string;

  @IsOptional()
  @IsString({ message: 'Cadde/Sokak metin olmali' })
  @MaxLength(300, { message: 'Cadde/Sokak en fazla 300 karakter olmali' })
  street?: string;

  @IsOptional()
  @IsString({ message: 'Posta kodu metin olmali' })
  @MaxLength(10, { message: 'Posta kodu en fazla 10 karakter olmali' })
  postalCode?: string;

  @IsEnum(['APARTMENT', 'HOUSE', 'STUDIO', 'OFFICE', 'OTHER'], {
    message: 'Gecerli bir mulk tipi secin (APARTMENT, HOUSE, STUDIO, OFFICE, OTHER)',
  })
  propertyType!: string;

  @IsOptional()
  @IsString({ message: 'Oda sayisi metin olmali (orn: 3+1, 2+1)' })
  @Matches(/^[0-9+]+$/, { message: 'Oda sayisi sadece rakam ve + icermeli (orn: 3+1)' })
  @MaxLength(10, { message: 'Oda sayisi en fazla 10 karakter olmali' })
  roomCount?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Alan (m2) sayi olmali' })
  @IsPositive({ message: 'Alan (m2) pozitif olmali' })
  areaM2?: number;

  @IsOptional()
  @IsInt({ message: 'Kat tam sayi olmali' })
  @Min(0, { message: 'Kat 0 veya uzerinde olmali' })
  @Max(100, { message: 'Kat en fazla 100 olmali' })
  floor?: number;

  @IsOptional()
  @IsInt({ message: 'Toplam kat tam sayi olmali' })
  @Min(1, { message: 'Toplam kat en az 1 olmali' })
  @Max(100, { message: 'Toplam kat en fazla 100 olmali' })
  totalFloors?: number;

  @IsNumber({}, { message: 'Kira bedeli sayi olmali' })
  @IsPositive({ message: 'Kira bedeli pozitif olmali' })
  monthlyRent!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Depozito sayi olmali' })
  @IsPositive({ message: 'Depozito pozitif olmali' })
  depositAmount?: number;

  @IsOptional()
  @IsString({ message: 'Aciklama metin olmali' })
  @MaxLength(2000, { message: 'Aciklama en fazla 2000 karakter olmali' })
  description?: string;
}
