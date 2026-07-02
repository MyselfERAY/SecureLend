"use client";

import type { Filter, FilterOp, TableMeta } from "@/lib/types";

const OPS: FilterOp[] = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "LIKE",
  "IN",
  "NOT IN",
  "BETWEEN",
  "IS NULL",
  "IS NOT NULL",
];

const NO_VALUE: FilterOp[] = ["IS NULL", "IS NOT NULL"];

export default function FilterRow({
  filter,
  table,
  onChange,
  onRemove,
}: {
  filter: Filter;
  table: TableMeta | null;
  onChange: (f: Filter) => void;
  onRemove: () => void;
}) {
  const set = (patch: Partial<Filter>) => onChange({ ...filter, ...patch });

  return (
    <div className="flex w-full flex-wrap items-center gap-1.5 rounded-md border border-bi-border bg-bi-panel2 p-1.5">
      <select
        value={filter.column}
        onChange={(e) => set({ column: e.target.value })}
        className="min-w-[110px] flex-1 rounded border border-bi-border bg-bi-panel px-1.5 py-1 text-xs text-bi-text outline-none"
      >
        {table?.columns.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={filter.op}
        onChange={(e) => set({ op: e.target.value as FilterOp })}
        className="rounded border border-bi-border bg-bi-panel px-1.5 py-1 text-xs text-bi-text outline-none"
      >
        {OPS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {!NO_VALUE.includes(filter.op) && filter.op === "BETWEEN" && (
        <div className="flex items-center gap-1">
          <input
            value={filter.range?.[0] ?? ""}
            onChange={(e) =>
              set({ range: [e.target.value, filter.range?.[1] ?? ""] })
            }
            placeholder="alt"
            className="w-20 rounded border border-bi-border bg-bi-panel px-1.5 py-1 text-xs text-bi-text outline-none"
          />
          <span className="text-bi-dim">–</span>
          <input
            value={filter.range?.[1] ?? ""}
            onChange={(e) =>
              set({ range: [filter.range?.[0] ?? "", e.target.value] })
            }
            placeholder="üst"
            className="w-20 rounded border border-bi-border bg-bi-panel px-1.5 py-1 text-xs text-bi-text outline-none"
          />
        </div>
      )}

      {!NO_VALUE.includes(filter.op) &&
        (filter.op === "IN" || filter.op === "NOT IN") && (
          <input
            value={(filter.values ?? []).join(", ")}
            onChange={(e) =>
              set({
                values: e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
            placeholder="a, b, c"
            className="min-w-[120px] flex-1 rounded border border-bi-border bg-bi-panel px-1.5 py-1 text-xs text-bi-text outline-none"
          />
        )}

      {!NO_VALUE.includes(filter.op) &&
        filter.op !== "BETWEEN" &&
        filter.op !== "IN" &&
        filter.op !== "NOT IN" && (
          <input
            value={filter.value ?? ""}
            onChange={(e) => set({ value: e.target.value })}
            placeholder="değer"
            className="min-w-[120px] flex-1 rounded border border-bi-border bg-bi-panel px-1.5 py-1 text-xs text-bi-text outline-none"
          />
        )}

      <button
        type="button"
        onClick={onRemove}
        className="rounded px-1.5 py-1 text-bi-dim hover:bg-bi-border hover:text-bi-text"
        title="Filtreyi kaldır"
      >
        ×
      </button>
    </div>
  );
}
