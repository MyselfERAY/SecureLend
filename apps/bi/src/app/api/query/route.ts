import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getConnection } from "@/lib/store";
import { canAccessConnection } from "@/lib/connection-access";
import { runReport } from "@/lib/query-service";
import { clampLimit } from "@/lib/query-builder";
import { fail, handle, ok } from "@/lib/http";
import type { PageRequest, ReportQuery } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as {
      query?: ReportQuery;
      page?: Partial<PageRequest>;
    };
    const query = body.query;
    if (!query?.connectionId || !query.table) {
      return fail("connectionId ve table zorunlu");
    }
    const conn = await getConnection(query.connectionId);
    if (!conn) return fail("Bağlantı bulunamadı", 404);
    // IDOR koruması: yalnızca bağlantının sahibi/admin sorgu çalıştırabilir.
    if (!canAccessConnection(conn, user)) {
      return fail("Bu bağlantıya erişim yetkiniz yok", 403);
    }

    const page: PageRequest = {
      offset: Math.max(0, Math.floor(body.page?.offset ?? 0)),
      limit: clampLimit(body.page?.limit ?? 50),
    };
    const result = await runReport(conn, query, page);
    return ok(result);
  });
}
