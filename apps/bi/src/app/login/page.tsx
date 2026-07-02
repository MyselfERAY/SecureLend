"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.login(username, password);
      router.replace("/editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bi-bg px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-bi-border bg-bi-panel p-8 shadow-2xl"
      >
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-bi-text">SecureLend BI</h1>
          <p className="mt-1 text-sm text-bi-muted">
            Sürükle-bırak rapor editörü
          </p>
        </div>

        <label className="mb-1 block text-xs font-medium text-bi-muted">
          Kullanıcı adı
        </label>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-lg border border-bi-border bg-bi-panel2 px-3 py-2 text-sm text-bi-text outline-none focus:border-bi-accent"
          placeholder="admin"
        />

        <label className="mb-1 block text-xs font-medium text-bi-muted">
          Şifre
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-bi-border bg-bi-panel2 px-3 py-2 text-sm text-bi-text outline-none focus:border-bi-accent"
          placeholder="••••••••"
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-bi-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-bi-accent2 disabled:opacity-50"
        >
          {busy ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </div>
  );
}
