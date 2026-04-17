import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';
import { EncryptionService } from './encryption.service';

/**
 * HMAC-SHA256 for indexing (TCKN_HASH_PEPPER) + AES-256-GCM for reversible PII storage
 * (TCKN_ENCRYPTION_KEY).
 *
 * Key design rule: **the service must never crash boot if TCKN_ENCRYPTION_KEY is missing.**
 * Existing deployments may not have it set. encrypt()/decrypt() simply return null
 * when the key is absent; callers must treat encryption as best-effort.
 */
@Injectable()
export class HashEncryptionService extends EncryptionService {
  private readonly logger = new Logger(HashEncryptionService.name);
  private readonly pepper: string;
  private readonly aesKey: Buffer | null;

  constructor(private readonly configService: ConfigService) {
    super();
    this.pepper = this.configService.getOrThrow<string>('TCKN_HASH_PEPPER');

    const rawKey = this.configService.get<string>('TCKN_ENCRYPTION_KEY');
    if (!rawKey) {
      this.aesKey = null;
      this.logger.warn(
        'TCKN_ENCRYPTION_KEY not configured — reversible encryption disabled (hash-only mode).',
      );
    } else if (!/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      this.aesKey = null;
      this.logger.error(
        'TCKN_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Encryption disabled.',
      );
    } else {
      this.aesKey = Buffer.from(rawKey, 'hex');
    }
  }

  hash(plainText: string): string {
    return createHmac('sha256', this.pepper).update(plainText).digest('hex');
  }

  verify(plainText: string, existingHash: string): boolean {
    const newHash = this.hash(plainText);
    try {
      return timingSafeEqual(
        Buffer.from(newHash, 'hex'),
        Buffer.from(existingHash, 'hex'),
      );
    } catch {
      return false;
    }
  }

  /**
   * Payload format (base64): [12-byte IV][16-byte auth tag][ciphertext]
   * Returns null if key is unavailable — caller persists null, no exception.
   */
  encrypt(plainText: string): string | null {
    if (!this.aesKey) return null;
    try {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', this.aesKey, iv);
      const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final(),
      ]);
      const tag = cipher.getAuthTag();
      return Buffer.concat([iv, tag, encrypted]).toString('base64');
    } catch (err) {
      this.logger.error(
        `encrypt() failed: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  decrypt(cipherText: string): string | null {
    if (!this.aesKey || !cipherText) return null;
    try {
      const buf = Buffer.from(cipherText, 'base64');
      if (buf.length < 12 + 16 + 1) return null;
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(12, 28);
      const data = buf.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', this.aesKey, iv);
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(data), decipher.final()]);
      return plain.toString('utf8');
    } catch (err) {
      this.logger.warn(
        `decrypt() failed: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }
}
