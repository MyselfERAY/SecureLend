import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { findUserByName, getReport, listUsers, saveReport } from "@/lib/store";
import { canManage } from "@/lib/reports-access";
import { fail, handle, ok } from "@/lib/http";
import type { SharePermission } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const report = await getReport(id);
    if (!report) return fail("Rapor bulunamadı", 404);
    if (!canManage(report, user)) return fail("Paylaşım yetkiniz yok", 403);

    const body = (await req.json().catch(() => ({}))) as {
      username?: string;
      permission?: SharePermission | "remove";
    };
    if (!body.username) return fail("username gerekli");
    const target = await findUserByName(body.username);
    if (!target) return fail("Kullanıcı bulunamadı", 404);
    if (target.id === report.ownerId) {
      return fail("Sahip ile paylaşım yapılamaz");
    }

    const shares = report.shares.filter((s) => s.userId !== target.id);
    if (body.permission && body.permission !== "remove") {
      shares.push({ userId: target.id, permission: body.permission });
    }
    const updated = {
      ...report,
      shares,
      updatedAt: new Date().toISOString(),
    };
    await saveReport(updated);

    const users = await listUsers();
    const nameById = new Map(users.map((u) => [u.id, u.username]));
    return ok({
      shares: updated.shares.map((s) => ({
        ...s,
        username: nameById.get(s.userId) ?? "?",
      })),
    });
  });
}
