import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class EncryptionService {
  /** HMAC hash — irreversible, for indexing/lookup (e.g. TCKN hash) */
  abstract hash(plainText: string): string;
  abstract verify(plainText: string, hash: string): boolean;

  /** AES encryption — reversible, for sensitive data that needs to be retrieved (e.g. TCKN for NVI/KKB queries) */
  abstract encrypt(plainText: string): string;
  abstract decrypt(cipherText: string): string;
}
