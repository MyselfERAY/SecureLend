import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUser, listUsers } from "@/lib/store";
import { fail, handle, ok } from "@/lib/http";
import type { UserRole } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requireUser();
    const users = await listUsers();
    return ok(
      users.map((u) => ({ id: u.id, username: u.username, role: u.role })),
    );
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (user.role !== "admin") return fail("Sadece admin kullanıcı ekleyebilir", 403);
    const body = (await req.json().catch(() => ({}))) as {
      username?: string;
      password?: string;
      role?: UserRole;
    };
    if (!body.username || !body.password) {
      return fail("username ve password zorunlu");
    }
    if (body.password.length < 6) {
      return fail("Şifre en az 6 karakter olmalı");
    }
    const created = await createUser(
      body.username,
      body.password,
      body.role === "admin" ? "admin" : "user",
    );
    return ok({ id: created.id, username: created.username, role: created.role }, 201);
  });
}
