import type { ColumnType } from "@/lib/types";

export interface DragPayload {
  column: string;
  type: ColumnType;
  /** where the drag originated, so we can support move-out semantics later */
  from?: string;
}

const MIME = "application/x-bi-field";

export function setDragField(e: React.DragEvent, payload: DragPayload): void {
  e.dataTransfer.setData(MIME, JSON.stringify(payload));
  e.dataTransfer.setData("text/plain", payload.column);
  e.dataTransfer.effectAllowed = "copyMove";
}

export function getDragField(e: React.DragEvent): DragPayload | null {
  const raw = e.dataTransfer.getData(MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

export function typeBadge(type: ColumnType): { label: string; cls: string } {
  switch (type) {
    case "number":
      return { label: "123", cls: "text-bi-values" };
    case "date":
      return { label: "DATE", cls: "text-bi-filters" };
    case "string":
      return { label: "ABC", cls: "text-bi-rows" };
    default:
      return { label: "•", cls: "text-bi-dim" };
  }
}
