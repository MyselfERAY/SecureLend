"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { SharePermission, UserPublic } from "@/lib/types";

interface ShareRow {
  userId: string;
  username: string;
  permission: SharePermission;
}

export default function ShareDialog({
  reportId,
  reportName,
  onClose,
}: {
  reportId: string;
  reportName: string;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [u, r] = await Promise.all([api.users(), api.getReport(reportId)]);
        setUsers(u);
        setShares(r.shares);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Yüklenemedi");
      }
    })();
  }, [reportId]);

  async function apply(name: string, perm: SharePermission | "remove") {
    setError(null);
    setBusy(true);
    try {
      const res = await api.share(reportId, name, perm);
      setShares(res.shares);
      setUsername("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Paylaşım başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-bi-border bg-bi-panel p-6">
        <h2 className="mb-1 text-lg font-semibold text-bi-text">Paylaş</h2>
        <p className="mb-4 truncate text-sm text-bi-muted">{reportName}</p>

        <div className="mb-3 flex gap-2">
          <input
            list="bi-users"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="kullanıcı adı"
            className="flex-1 rounded-lg border border-bi-border bg-bi-panel2 px-3 py-2 text-sm text-bi-text outline-none focus:border-bi-accent"
          />
          <datalist id="bi-users">
            {users.map((u) => (
              <option key={u.id} value={u.username} />
            ))}
          </datalist>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as SharePermission)}
            className="rounded-lg border border-bi-border bg-bi-panel2 px-2 py-2 text-sm text-bi-text outline-none"
          >
            <option value="view">Görüntüleme</option>
            <option value="edit">Düzenleme</option>
          </select>
          <button
            type="button"
            disabled={busy || !username}
            onClick={() => apply(username, permission)}
            className="rounded-lg bg-bi-accent px-3 py-2 text-sm font-medium text-white hover:bg-bi-accent2 disabled:opacity-50"
          >
            Ekle
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="max-h-56 overflow-auto rounded-lg border border-bi-border">
          {shares.length === 0 ? (
            <div className="p-3 text-center text-xs text-bi-dim">
              Henüz paylaşılmadı.
            </div>
          ) : (
            shares.map((s) => (
              <div
                key={s.userId}
                className="flex items-center justify-between border-b border-bi-border px-3 py-2 text-sm last:border-0"
              >
                <span className="text-bi-text">{s.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-bi-muted">
                    {s.permission === "edit" ? "Düzenleme" : "Görüntüleme"}
                  </span>
                  <button
                    type="button"
                    onClick={() => apply(s.username, "remove")}
                    className="rounded px-1.5 text-bi-dim hover:bg-bi-border hover:text-red-300"
                    title="Kaldır"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-bi-border px-3 py-2 text-sm text-bi-muted hover:bg-bi-panel2"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
