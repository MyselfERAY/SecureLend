import { IsString, IsNumber, IsUUID, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { IsTurkishIban } from '../../../common/validators/iban.validator';

export class TransferDto {
  @IsUUID()
  fromAccountId: string;

  @IsTurkishIban()
  toIban: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
