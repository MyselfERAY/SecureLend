import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { encryptSecret, newId } from "@/lib/crypto";
import { listConnections, saveConnection } from "@/lib/store";
import { testConnection } from "@/lib/oracle";
import { toConnectionPublic } from "@/lib/mappers";
import { fail, handle, ok } from "@/lib/http";
import type { Connection, ConnectionInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const conns = await listConnections();
    // Non-admin yalnızca kendi bağlantılarını görür (global havuz sızıntısı önlemi)
    const visible =
      user.role === "admin"
        ? conns
        : conns.filter((c) => c.ownerId === user.id);
    return ok(visible.map(toConnectionPublic));
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as ConnectionInput & {
      test?: boolean;
    };
    if (!body.name || !body.host || !body.port || !body.user || !body.password) {
      return fail("name, host, port, user, password zorunlu");
    }
    if (!body.serviceName && !body.sid) {
      return fail("serviceName veya sid belirtilmeli");
    }
    const conn: Connection = {
      id: newId("con"),
      name: body.name,
      host: body.host,
      port: Number(body.port),
      serviceName: body.serviceName,
      sid: body.sid,
      user: body.user,
      defaultSchema: body.defaultSchema,
      passwordEnc: encryptSecret(body.password),
      ownerId: user.id,
      createdAt: new Date().toISOString(),
    };
    // verify it actually connects before persisting
    try {
      await testConnection(conn);
    } catch (e) {
      return fail(
        `Bağlantı test edilemedi: ${e instanceof Error ? e.message : "hata"}`,
        400,
      );
    }
    await saveConnection(conn);
    return ok(toConnectionPublic(conn), 201);
  });
}
