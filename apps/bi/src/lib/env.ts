// Merkezi güvenlik-kritik yapılandırma. Production'da zayıf/placeholder secret'lar
// ile ÇALIŞMAYI REDDEDER (fail-hard). Geliştirmede kolaylık için fallback'lere izin verir.

const isProd = process.env.NODE_ENV === "production";

const PLACEHOLDERS = new Set([
  "insecure-dev-secret-change-me",
  "insecure-dev-key",
  "change-me",
  "changeme",
  "admin1234",
  "",
]);

function requireStrongInProd(
  name: string,
  value: string | undefined,
  devFallback: string,
  validate?: (v: string) => boolean,
): string {
  const v = (value ?? "").trim();
  const weak = PLACEHOLDERS.has(v) || (validate ? !validate(v) : v.length < 16);
  if (weak) {
    if (isProd) {
      throw new Error(
        `[BI] ${name} production'da tanımlı ve güçlü olmalı — uygulama başlatılmadı.`,
      );
    }
    return v && !PLACEHOLDERS.has(v) ? v : devFallback;
  }
  return v;
}

/** JWT oturum imzalama secret'ı (min 16 karakter). */
export function authSecret(): string {
  return requireStrongInProd(
    "BI_AUTH_SECRET",
    process.env.BI_AUTH_SECRET,
    "insecure-dev-secret-change-me",
  );
}

/**
 * AES-256-GCM anahtarı için ham değer. Production'da 64 hex karakter (32 byte)
 * ZORUNLU. Dev'de herhangi bir değer kabul edilir (crypto tarafı SHA-256 türetir).
 */
export function cryptoKeyRaw(): string {
  return requireStrongInProd(
    "BI_CRYPTO_KEY",
    process.env.BI_CRYPTO_KEY,
    "insecure-dev-key",
    (v) => /^[0-9a-fA-F]{64}$/.test(v),
  );
}
