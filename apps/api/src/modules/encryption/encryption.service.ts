import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class EncryptionService {
  /** Deterministic HMAC hash (used for DB lookups/indexing). */
  abstract hash(plainText: string): string;

  /** Constant-time comparison against an existing hash. */
  abstract verify(plainText: string, hash: string): boolean;

  /**
   * Reversible encryption (AES-256-GCM) for PII storage.
   * Returns null if the encryption key is not configured — callers must handle this
   * gracefully and never throw solely because encryption is unavailable.
   */
  abstract encrypt(plainText: string): string | null;

  /**
   * Reverse of encrypt(). Returns null if decryption is impossible
   * (missing key, corrupt payload, wrong key). Never throws.
   */
  abstract decrypt(cipherText: string): string | null;
}
