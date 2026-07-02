import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getConnection } from "@/lib/store";
import { canAccessConnection } from "@/lib/connection-access";
import { getSchema } from "@/lib/oracle";
import { fail, handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const conn = await getConnection(id);
    if (!conn) return fail("Bağlantı bulunamadı", 404);
    if (!canAccessConnection(conn, user)) {
      return fail("Bu bağlantıya erişim yetkiniz yok", 403);
    }
    const url = new URL(req.url);
    const schema = url.searchParams.get("schema") || undefined;
    const force = url.searchParams.get("force") === "1";
    const tables = await getSchema(conn, schema, force);
    return ok({ schema: schema || conn.defaultSchema || conn.user, tables });
  });
}
