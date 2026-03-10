import { Module } from '@nestjs/common';
import { BankService } from './bank.service';
import { MockBankService } from './mock-bank.service';
import { BankController } from './bank.controller';

@Module({
  controllers: [BankController],
  providers: [
    {
      provide: BankService,
      useClass: MockBankService,
    },
  ],
  exports: [BankService],
})
export class BankModule {}
