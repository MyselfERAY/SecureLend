import { Module } from '@nestjs/common';
import { BankModule } from '../bank/bank.module';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';

@Module({
  imports: [BankModule],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
