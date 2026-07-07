import { redirect } from "next/navigation";
import { getCurrentUser, toPublic } from "@/lib/auth";
import { ensureBootstrap } from "@/lib/store";
import Editor from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  await ensureBootstrap();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <Editor user={toPublic(user)} />;
}
