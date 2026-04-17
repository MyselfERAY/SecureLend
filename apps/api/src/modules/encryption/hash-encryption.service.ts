import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHmac,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import { EncryptionService } from './encryption.service';

/**
 * HashEncryptionService — hem HMAC hash hem AES-256-GCM encryption sağlar.
 *
 * - hash/verify: HMAC-SHA256 (TCKN_HASH_PEPPER) — indexleme/lookup için.
 * - encrypt/decrypt: AES-256-GCM (TCKN_ENCRYPTION_KEY) — NVI/KKB sorgusu için TCKN'yi geri çevrilebilir şekilde saklamak için.
 *
 * Format (encrypt output): base64(iv || authTag || ciphertext)
 *   - iv: 12 bytes (GCM standart)
 *   - authTag: 16 bytes
 *   - ciphertext: variable length
 */
@Injectable()
export class HashEncryptionService extends EncryptionService {
  private readonly logger = new Logger(HashEncryptionService.name);
  private readonly pepper: string;
  private readonly aesKey: Buffer;

  private static readonly ALGO = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12;
  private static readonly AUTH_TAG_LENGTH = 16;

  constructor(private readonly configService: ConfigService) {
    super();
    this.pepper = this.configService.getOrThrow<string>('TCKN_HASH_PEPPER');

    // TCKN_ENCRYPTION_KEY: 64 hex karakter (32 byte) bekliyoruz.
    // Yoksa pepper'dan deterministic olarak türet (backward compatibility + safety fallback).
    const configuredKey = this.configService.get<string>('TCKN_ENCRYPTION_KEY');
    if (configuredKey && /^[0-9a-fA-F]{64}$/.test(configuredKey)) {
      this.aesKey = Buffer.from(configuredKey, 'hex');
    } else {
      // Fallback: derive from pepper using scrypt (deterministic, 32 bytes)
      if (configuredKey) {
        this.logger.warn(
          'TCKN_ENCRYPTION_KEY provided but invalid (expected 64 hex chars) — falling back to derived key',
        );
      } else {
        this.logger.warn(
          'TCKN_ENCRYPTION_KEY not set — using derived key from TCKN_HASH_PEPPER (production should set a dedicated key)',
        );
      }
      this.aesKey = scryptSync(this.pepper, 'securelend-tckn-salt', 32);
    }
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

  encrypt(plainText: string): string {
    const iv = randomBytes(HashEncryptionService.IV_LENGTH);
    const cipher = createCipheriv(HashEncryptionService.ALGO, this.aesKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // Format: iv || authTag || ciphertext
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decrypt(cipherText: string): string {
    const buf = Buffer.from(cipherText, 'base64');
    if (buf.length < HashEncryptionService.IV_LENGTH + HashEncryptionService.AUTH_TAG_LENGTH) {
      throw new Error('Invalid ciphertext: too short');
    }
    const iv = buf.subarray(0, HashEncryptionService.IV_LENGTH);
    const authTag = buf.subarray(
      HashEncryptionService.IV_LENGTH,
      HashEncryptionService.IV_LENGTH + HashEncryptionService.AUTH_TAG_LENGTH,
    );
    const encrypted = buf.subarray(
      HashEncryptionService.IV_LENGTH + HashEncryptionService.AUTH_TAG_LENGTH,
    );
    const decipher = createDecipheriv(HashEncryptionService.ALGO, this.aesKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
