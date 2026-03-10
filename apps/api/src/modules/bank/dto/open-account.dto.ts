import { IsEnum, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { BankAccountType } from '@prisma/client';

export class OpenAccountDto {
  @IsEnum(BankAccountType)
  accountType: BankAccountType;

  @IsUUID()
  contractId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number;
}
