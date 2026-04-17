import { IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyIdentityDto {
  @ApiProperty({ description: 'TC Kimlik Numarası (11 hane)', example: '12345678901' })
  @IsString()
  @Length(11, 11, { message: 'TC Kimlik No 11 haneli olmalıdır' })
  @Matches(/^\d{11}$/, { message: 'TC Kimlik No sadece rakamlardan oluşmalıdır' })
  tckn!: string;

  @ApiProperty({ description: 'Doğum yılı (4 hane)', example: 1990 })
  @Type(() => Number)
  @IsInt({ message: 'Doğum yılı tam sayı olmalıdır' })
  @Min(1900)
  @Max(2010)
  birthYear!: number;

  @ApiProperty({ description: 'Ad', example: 'AHMET' })
  @IsString()
  @Length(2, 100, { message: 'Ad en az 2 karakter olmalıdır' })
  firstName!: string;

  @ApiProperty({ description: 'Soyad', example: 'YILMAZ' })
  @IsString()
  @Length(2, 100, { message: 'Soyad en az 2 karakter olmalıdır' })
  lastName!: string;
}
