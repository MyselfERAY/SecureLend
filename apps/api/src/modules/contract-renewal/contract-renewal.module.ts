import { Module } from '@nestjs/common';
import { ContractRenewalService } from './contract-renewal.service';

@Module({
  providers: [ContractRenewalService],
})
export class ContractRenewalModule {}
