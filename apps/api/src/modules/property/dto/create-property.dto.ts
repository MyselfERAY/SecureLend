import {
  IsString, IsNumber, IsOptional, IsInt, IsEnum,
  MaxLength, MinLength, Min, Max, IsPositive,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString() @MinLength(5) @MaxLength(200)
  title!: string;

  @IsString() @MinLength(10) @MaxLength(300)
  addressLine1!: string;

  @IsOptional() @IsString() @MaxLength(300)
  addressLine2?: string;

  @IsString() @MinLength(2) @MaxLength(100)
  city!: string;

  @IsString() @MinLength(2) @MaxLength(100)
  district!: string;

  @IsOptional() @IsString() @MaxLength(10)
  postalCode?: string;

  @IsEnum(['APARTMENT', 'HOUSE', 'STUDIO', 'OFFICE', 'OTHER'])
  propertyType!: string;

  @IsOptional() @IsString() @MaxLength(10)
  roomCount?: string;

  @IsOptional() @IsNumber() @IsPositive()
  areaM2?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100)
  floor?: number;

  @IsOptional() @IsInt() @Min(1) @Max(100)
  totalFloors?: number;

  @IsNumber() @IsPositive()
  monthlyRent!: number;

  @IsOptional() @IsNumber() @IsPositive()
  depositAmount?: number;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;
}
