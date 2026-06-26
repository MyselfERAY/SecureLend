import { IsNumber, IsUUID, IsInt, Min, Max } from 'class-validator';
import { IsTurkishIban } from '../../../common/validators/iban.validator';

export class CreatePaymentOrderDto {
  @IsUUID()
  contractId: string;

  @IsUUID()
  fromAccountId: string;

  @IsTurkishIban()
  toIban: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000)
  amount: number;

  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth: number;
}
