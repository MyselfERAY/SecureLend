import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { QueryError } from "./query-builder";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ status: "success", data }, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ status: "fail", message }, { status });
}

export function serverError(message = "Sunucu hatası") {
  return NextResponse.json({ status: "error", message }, { status: 500 });
}

/** Wrap a handler so domain errors map to clean JSON responses. */
export function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  return fn().catch((err: unknown) => {
    if (err instanceof AuthError) return fail(err.message, err.statusCode);
    if (err instanceof QueryError) return fail(err.message, 400);
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    // Oracle/driver iç hatalarını istemciye SIZDIRMA — sunucuda logla, generic dön.
    console.error("[bi:api]", message);
    return NextResponse.json(
      { status: "error", message: "Sunucu hatası" },
      { status: 500 },
    );
  });
}
