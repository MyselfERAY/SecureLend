import { IsString, IsNumber, IsUUID, IsOptional, Min, MaxLength } from 'class-validator';

export class TransferDto {
  @IsUUID()
  fromAccountId: string;

  @IsString()
  @MaxLength(26)
  toIban: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
