import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { HashEncryptionService } from './hash-encryption.service';

@Global()
@Module({
  providers: [
    {
      provide: EncryptionService,
      useClass: HashEncryptionService,
    },
  ],
  exports: [EncryptionService],
})
export class EncryptionModule {}
