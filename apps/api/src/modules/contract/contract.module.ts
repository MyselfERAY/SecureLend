import { Module } from '@nestjs/common';
import { BankModule } from '../bank/bank.module';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ContractPdfService } from './contract-pdf.service';

@Module({
  imports: [BankModule],
  controllers: [ContractController],
  providers: [ContractService, ContractPdfService],
  exports: [ContractService],
})
export class ContractModule {}
