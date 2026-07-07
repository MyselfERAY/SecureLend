import { NextRequest } from "next/server";
import { createSession, setSessionCookie, toPublic } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { ensureBootstrap, findUserByName } from "@/lib/store";
import { rateLimit, rateLimitReset } from "@/lib/rate-limit";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await ensureBootstrap();
    const body = (await req.json().catch(() => ({}))) as {
      username?: string;
      password?: string;
    };
    if (!body.username || !body.password) {
      return fail("Kullanıcı adı ve şifre gerekli");
    }

    // Kaba-kuvvet koruması: IP + kullanıcı adı başına deneme limiti + lockout
    const rlKey = `login:${clientIp(req)}:${body.username.toLowerCase()}`;
    const rl = rateLimit(rlKey);
    if (!rl.allowed) {
      return fail(
        `Çok fazla başarısız deneme. ${rl.retryAfterSec} sn sonra tekrar deneyin.`,
        429,
      );
    }

    const user = await findUserByName(body.username);
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return fail("Geçersiz kullanıcı adı veya şifre", 401);
    }

    rateLimitReset(rlKey); // başarılı giriş → sayaç sıfırla
    const token = await createSession(user);
    await setSessionCookie(token);
    return ok({ user: toPublic(user) });
  });
}
