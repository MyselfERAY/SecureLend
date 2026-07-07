import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteReport, getReport, listUsers, saveReport } from "@/lib/store";
import { canEdit, canManage, canView, permissionFor } from "@/lib/reports-access";
import { fail, handle, ok } from "@/lib/http";
import type { ReportQuery } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const report = await getReport(id);
    if (!report) return fail("Rapor bulunamadı", 404);
    if (!canView(report, user)) return fail("Erişim yetkiniz yok", 403);
    const users = await listUsers();
    const nameById = new Map(users.map((u) => [u.id, u.username]));
    return ok({
      ...report,
      permission: permissionFor(report, user),
      shares: report.shares.map((s) => ({
        ...s,
        username: nameById.get(s.userId) ?? "?",
      })),
    });
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const report = await getReport(id);
    if (!report) return fail("Rapor bulunamadı", 404);
    if (!canEdit(report, user)) return fail("Düzenleme yetkiniz yok", 403);
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      query?: ReportQuery;
    };
    const updated = {
      ...report,
      name: body.name ?? report.name,
      query: body.query ?? report.query,
      updatedAt: new Date().toISOString(),
    };
    await saveReport(updated);
    return ok(updated);
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const report = await getReport(id);
    if (!report) return fail("Rapor bulunamadı", 404);
    if (!canManage(report, user)) return fail("Silme yetkiniz yok", 403);
    await deleteReport(id);
    return ok({ ok: true });
  });
}
