// Basit in-process rate limiter (tek instance JSON-store mimarisiyle uyumlu).
// Kaba-kuvvet parola denemelerini yavaşlatmak için sabit-pencere sayaç + lockout.

type Bucket = { count: number; resetAt: number; blockedUntil: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

/**
 * @param key      İzole anahtar (örn. `login:<ip>:<username>`)
 * @param limit    Pencere başına izin verilen deneme
 * @param windowMs Pencere süresi (ms)
 * @param blockMs  Limit aşılınca uygulanan kilit süresi (ms)
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
  blockMs = 5 * 60_000,
): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(key);

  if (b && b.blockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000) };
  }

  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs, blockedUntil: 0 };
    buckets.set(key, b);
  }

  b.count += 1;
  if (b.count > limit) {
    b.blockedUntil = now + blockMs;
    return { allowed: false, retryAfterSec: Math.ceil(blockMs / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/** Başarılı girişte sayacı sıfırla (meşru kullanıcı cezalandırılmasın). */
export function rateLimitReset(key: string): void {
  buckets.delete(key);
}
