import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateResearchRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  topic: string;

  @IsOptional()
  @IsString()
  details?: string;
}
