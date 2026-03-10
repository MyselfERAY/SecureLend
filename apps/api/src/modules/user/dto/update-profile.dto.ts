import { IsString, IsEmail, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Gecerli bir email adresi girin' })
  email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Gecerli bir tarih girin (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
