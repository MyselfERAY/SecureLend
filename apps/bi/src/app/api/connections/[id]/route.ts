import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import {
  deleteConnection,
  getConnection,
  saveConnection,
} from "@/lib/store";
import {
  closePool,
  invalidateSchema,
  testConnection,
} from "@/lib/oracle";
import { toConnectionPublic } from "@/lib/mappers";
import { canAccessConnection } from "@/lib/connection-access";
import { fail, handle, ok } from "@/lib/http";
import type { ConnectionInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const conn = await getConnection(id);
    if (!conn) return fail("Bağlantı bulunamadı", 404);
    // IDOR koruması: sahibi/admin olmayan bağlantı detayını göremez
    if (!canAccessConnection(conn, user)) {
      return fail("Bu bağlantıya erişim yetkiniz yok", 403);
    }
    return ok(toConnectionPublic(conn));
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const conn = await getConnection(id);
    if (!conn) return fail("Bağlantı bulunamadı", 404);
    if (conn.ownerId !== user.id && user.role !== "admin") {
      return fail("Bu bağlantıyı düzenleme yetkiniz yok", 403);
    }
    const body = (await req.json().catch(() => ({}))) as Partial<ConnectionInput>;
    const updated = {
      ...conn,
      name: body.name ?? conn.name,
      host: body.host ?? conn.host,
      port: body.port ? Number(body.port) : conn.port,
      serviceName: body.serviceName ?? conn.serviceName,
      sid: body.sid ?? conn.sid,
      user: body.user ?? conn.user,
      defaultSchema: body.defaultSchema ?? conn.defaultSchema,
      passwordEnc: body.password ? encryptSecret(body.password) : conn.passwordEnc,
    };
    try {
      await testConnection(updated);
    } catch (e) {
      return fail(
        `Bağlantı test edilemedi: ${e instanceof Error ? e.message : "hata"}`,
        400,
      );
    }
    await saveConnection(updated);
    await closePool(id);
    invalidateSchema(id);
    return ok(toConnectionPublic(updated));
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const conn = await getConnection(id);
    if (!conn) return fail("Bağlantı bulunamadı", 404);
    if (conn.ownerId !== user.id && user.role !== "admin") {
      return fail("Bu bağlantıyı silme yetkiniz yok", 403);
    }
    await closePool(id);
    invalidateSchema(id);
    await deleteConnection(id);
    return ok({ ok: true });
  });
}
