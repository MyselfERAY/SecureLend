import { IsString, IsOptional, IsEmail, IsInt, Min, Max, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Davet edilenin tam adı' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ required: false, example: 'ahmet@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  email?: string;

  @ApiProperty({ required: false, example: '5551234567' })
  @IsOptional()
  @IsString()
  @Matches(/^5[0-9]{9}$/, { message: 'Telefon 5XXXXXXXXX formatında olmalı' })
  phone?: string;

  @ApiProperty({ required: false, description: 'Landing sayfasında gösterilecek özel mesaj' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiProperty({ required: false, default: 7, description: 'Linkin geçerlilik süresi (gün)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
