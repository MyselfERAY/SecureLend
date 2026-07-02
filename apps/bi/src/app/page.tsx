import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureBootstrap } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureBootstrap();
  const user = await getCurrentUser();
  redirect(user ? "/editor" : "/login");
}
