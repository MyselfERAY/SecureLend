import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  createHash,
} from "node:crypto";
import { cryptoKeyRaw } from "./env";

// ---------------------------------------------------------------------------
// Password hashing (scrypt — built into Node, no native add-on needed).
// Format: "<saltHex>:<hashHex>"
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------------------------------------------------------------------------
// Symmetric encryption for stored Oracle passwords (AES-256-GCM).
// Key comes from BI_CRYPTO_KEY (64 hex chars = 32 bytes). If it's not a valid
// 32-byte hex value we derive a 32-byte key from it via SHA-256 so the app
// still boots in dev — but production should set a real key.
// Format: "<ivHex>:<tagHex>:<cipherHex>"
// ---------------------------------------------------------------------------

function getKey(): Buffer {
  // Production'da cryptoKeyRaw() 64-hex olmayan/placeholder değeri reddeder (fail-hard).
  const raw = cryptoKeyRaw();
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  // Yalnızca dev: ham değerden 32 byte türet (uygulama boot olsun diye).
  return createHash("sha256").update(raw || "insecure-dev-key").digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(stored: string): string {
  const [ivHex, tagHex, cipherHex] = stored.split(":");
  if (!ivHex || !tagHex || !cipherHex) {
    throw new Error("Malformed encrypted secret");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(cipherHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("hex")}`;
}
