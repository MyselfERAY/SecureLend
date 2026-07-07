"use client";

import { useMemo, useState } from "react";
import type { TableMeta } from "@/lib/types";
import { setDragField, typeBadge } from "./dnd";

export default function FieldList({ table }: { table: TableMeta | null }) {
  const [q, setQ] = useState("");

  const cols = useMemo(() => {
    if (!table) return [];
    const needle = q.trim().toLowerCase();
    return table.columns.filter(
      (c) => !needle || c.name.toLowerCase().includes(needle),
    );
  }, [table, q]);

  if (!table) {
    return (
      <div className="p-4 text-sm text-bi-dim">
        Soldan bir tablo seçin; kolonlar burada listelenir.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-bi-border p-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`${table.name} kolonlarında ara…`}
          className="w-full rounded-md border border-bi-border bg-bi-panel2 px-2 py-1.5 text-xs text-bi-text outline-none focus:border-bi-accent"
        />
      </div>
      <div className="flex-1 overflow-auto p-1.5">
        {cols.map((c) => {
          const badge = typeBadge(c.type);
          return (
            <div
              key={c.name}
              draggable
              onDragStart={(e) =>
                setDragField(e, { column: c.name, type: c.type, from: "fields" })
              }
              onDragEnd={(e) => e.currentTarget.classList.remove("bi-dragging")}
              className="group flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-sm text-bi-text hover:bg-bi-panel2 active:cursor-grabbing"
              title={`${c.name} (${c.oracleType})`}
            >
              <span
                className={`w-9 shrink-0 text-[10px] font-bold tracking-tight ${badge.cls}`}
              >
                {badge.label}
              </span>
              <span className="truncate">{c.name}</span>
            </div>
          );
        })}
        {cols.length === 0 && (
          <div className="p-3 text-xs text-bi-dim">Eşleşen kolon yok.</div>
        )}
      </div>
    </div>
  );
}
