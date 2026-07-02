"use client";

import { useState } from "react";
import { getDragField, type DragPayload } from "./dnd";

const ACCENT: Record<string, string> = {
  rows: "border-l-bi-rows",
  columns: "border-l-bi-cols",
  values: "border-l-bi-values",
  filters: "border-l-bi-filters",
};

export function Shelf({
  zone,
  title,
  hint,
  onDropField,
  children,
  empty,
}: {
  zone: keyof typeof ACCENT;
  title: string;
  hint?: string;
  onDropField: (p: DragPayload) => void;
  children: React.ReactNode;
  empty: boolean;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const p = getDragField(e);
        if (p) onDropField(p);
      }}
      className={`rounded-md border border-bi-border border-l-4 ${ACCENT[zone]} bg-bi-panel p-2 transition ${
        over ? "ring-1 ring-bi-accent bg-bi-accent/5" : ""
      }`}
    >
      <div className="mb-1.5 flex items-baseline justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-bi-muted">
          {title}
        </span>
        {hint && <span className="text-[10px] text-bi-dim">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {empty ? (
          <div className="w-full rounded border border-dashed border-bi-border px-2 py-2 text-center text-[11px] text-bi-dim">
            Buraya alan sürükleyin
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function Chip({
  label,
  color,
  onRemove,
  children,
}: {
  label: string;
  color?: string;
  onRemove: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-bi-border bg-bi-panel2 py-1 pl-2 pr-1 text-xs text-bi-text">
      <span className={`max-w-[140px] truncate ${color ?? ""}`}>{label}</span>
      {children}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded px-1 text-bi-dim hover:bg-bi-border hover:text-bi-text"
        title="Kaldır"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
