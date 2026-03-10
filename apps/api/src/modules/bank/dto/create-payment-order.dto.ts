import { IsString, IsNumber, IsUUID, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreatePaymentOrderDto {
  @IsUUID()
  contractId: string;

  @IsUUID()
  fromAccountId: string;

  @IsString()
  @MaxLength(26)
  toIban: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth: number;
}
