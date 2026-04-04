import { IsString, IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivateContractDto {
  @ApiProperty({ description: 'UAVT (Ulusal Adres Veri Tabani) numarasi', example: '1234567890' })
  @IsString()
  @IsNotEmpty({ message: 'UAVT numarasi zorunludur' })
  @Matches(/^\d{5,20}$/, { message: 'UAVT numarasi 5-20 haneli bir sayi olmalidir' })
  uavtCode: string;

  @ApiPropertyOptional({ description: 'KMH hesap ID (birden fazla KMH varsa)' })
  @IsOptional()
  @IsUUID('4', { message: 'Gecerli bir KMH hesap ID giriniz' })
  kmhAccountId?: string;
}
