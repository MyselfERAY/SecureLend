"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import type { ConnectionPublic } from "@/lib/types";

export default function ConnectionDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: ConnectionPublic) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    host: "",
    port: "1521",
    connectBy: "service" as "service" | "sid",
    serviceName: "",
    sid: "",
    user: "",
    password: "",
    defaultSchema: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await api.createConnection({
        name: form.name,
        host: form.host,
        port: Number(form.port),
        serviceName: form.connectBy === "service" ? form.serviceName : undefined,
        sid: form.connectBy === "sid" ? form.sid : undefined,
        user: form.user,
        password: form.password,
        defaultSchema: form.defaultSchema || undefined,
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bağlantı eklenemedi");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-lg border border-bi-border bg-bi-panel2 px-3 py-2 text-sm text-bi-text outline-none focus:border-bi-accent";
  const label = "mb-1 block text-xs font-medium text-bi-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-bi-border bg-bi-panel p-6"
      >
        <h2 className="mb-4 text-lg font-semibold text-bi-text">
          Oracle bağlantısı ekle
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={label}>Ad</label>
            <input
              className={input}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Prod Oracle"
              required
            />
          </div>
          <div>
            <label className={label}>Host</label>
            <input
              className={input}
              value={form.host}
              onChange={(e) => set("host", e.target.value)}
              placeholder="db.example.com"
              required
            />
          </div>
          <div>
            <label className={label}>Port</label>
            <input
              className={input}
              value={form.port}
              onChange={(e) => set("port", e.target.value)}
              required
            />
          </div>

          <div className="col-span-2 flex gap-3">
            <label className="flex items-center gap-1.5 text-xs text-bi-muted">
              <input
                type="radio"
                checked={form.connectBy === "service"}
                onChange={() => set("connectBy", "service")}
              />
              Service Name
            </label>
            <label className="flex items-center gap-1.5 text-xs text-bi-muted">
              <input
                type="radio"
                checked={form.connectBy === "sid"}
                onChange={() => set("connectBy", "sid")}
              />
              SID
            </label>
          </div>

          {form.connectBy === "service" ? (
            <div className="col-span-2">
              <label className={label}>Service Name</label>
              <input
                className={input}
                value={form.serviceName}
                onChange={(e) => set("serviceName", e.target.value)}
                placeholder="ORCLPDB1"
                required
              />
            </div>
          ) : (
            <div className="col-span-2">
              <label className={label}>SID</label>
              <input
                className={input}
                value={form.sid}
                onChange={(e) => set("sid", e.target.value)}
                placeholder="XE"
                required
              />
            </div>
          )}

          <div>
            <label className={label}>Kullanıcı</label>
            <input
              className={input}
              value={form.user}
              onChange={(e) => set("user", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={label}>Şifre</label>
            <input
              type="password"
              className={input}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
            />
          </div>
          <div className="col-span-2">
            <label className={label}>
              Varsayılan şema{" "}
              <span className="text-bi-dim">(boşsa kullanıcı şeması)</span>
            </label>
            <input
              className={input}
              value={form.defaultSchema}
              onChange={(e) => set("defaultSchema", e.target.value)}
              placeholder="HR"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-bi-border px-3 py-2 text-sm text-bi-muted hover:bg-bi-panel2"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-bi-accent px-3 py-2 text-sm font-medium text-white hover:bg-bi-accent2 disabled:opacity-50"
          >
            {busy ? "Test ediliyor…" : "Test et ve kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
