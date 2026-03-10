import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { EncryptionService } from './encryption.service';

@Injectable()
export class HashEncryptionService extends EncryptionService {
  private readonly pepper: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.pepper = this.configService.getOrThrow<string>('TCKN_HASH_PEPPER');
  }

  hash(plainText: string): string {
    return createHmac('sha256', this.pepper)
      .update(plainText)
      .digest('hex');
  }

  verify(plainText: string, existingHash: string): boolean {
    const newHash = this.hash(plainText);
    return timingSafeEqual(
      Buffer.from(newHash, 'hex'),
      Buffer.from(existingHash, 'hex'),
    );
  }
}
