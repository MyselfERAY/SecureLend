import { getCurrentUser, toPublic } from "@/lib/auth";
import { ensureBootstrap } from "@/lib/store";
import { handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await ensureBootstrap();
    const user = await getCurrentUser();
    return ok({ user: user ? toPublic(user) : null });
  });
}
