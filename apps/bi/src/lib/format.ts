import type { ColumnType } from "./types";

const nf = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

export function formatCell(value: unknown, type: ColumnType): string {
  if (value === null || value === undefined) return "—";
  if (type === "number" && typeof value === "number") return nf.format(value);
  if (type === "number" && typeof value === "string" && value !== "") {
    const n = Number(value);
    if (!Number.isNaN(n)) return nf.format(n);
  }
  if (type === "date") {
    const d = new Date(String(value));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("tr-TR");
    }
  }
  return String(value);
}
