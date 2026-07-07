import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CSRF savunması: cookie tabanlı oturum (SameSite=Lax) durum değiştiren istekleri
// yeterince korumaz. Mutasyon metotlarında (POST/PUT/PATCH/DELETE) Origin başlığının
// Host ile aynı origin olmasını zorunlu kıl (same-origin kontrolü). Cross-site
// form/fetch istekleri farklı Origin taşır → 403.
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();
  if (!MUTATING.has(req.method.toUpperCase())) return NextResponse.next();

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  // İzin verilen ekstra origin'ler (virgülle ayrılmış), örn. ayrı bir front-end host.
  const allowlist = (process.env.BI_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let sameOrigin = false;
  if (origin) {
    try {
      const o = new URL(origin);
      sameOrigin =
        (!!host && o.host === host) || allowlist.includes(o.origin);
    } catch {
      sameOrigin = false;
    }
  }

  if (!sameOrigin) {
    return NextResponse.json(
      { error: "CSRF doğrulaması başarısız (origin uyuşmuyor)" },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
