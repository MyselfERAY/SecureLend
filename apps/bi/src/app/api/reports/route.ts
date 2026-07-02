import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { newId } from "@/lib/crypto";
import { listReports, listUsers, saveReport } from "@/lib/store";
import { canView, permissionFor } from "@/lib/reports-access";
import { fail, handle, ok } from "@/lib/http";
import type { ReportQuery, SavedReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const [reports, users] = await Promise.all([listReports(), listUsers()]);
    const nameById = new Map(users.map((u) => [u.id, u.username]));
    const visible = reports
      .filter((r) => canView(r, user))
      .map((r) => ({
        id: r.id,
        name: r.name,
        ownerId: r.ownerId,
        ownerName: nameById.get(r.ownerId) ?? "?",
        permission: permissionFor(r, user),
        updatedAt: r.updatedAt,
        connectionId: r.query.connectionId,
        table: r.query.table,
      }));
    return ok(visible);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      query?: ReportQuery;
    };
    if (!body.name || !body.query) return fail("name ve query zorunlu");
    const now = new Date().toISOString();
    const report: SavedReport = {
      id: newId("rep"),
      name: body.name,
      ownerId: user.id,
      query: body.query,
      shares: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveReport(report);
    return ok(report, 201);
  });
}
