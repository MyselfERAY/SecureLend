"use client";

import { useEffect, useRef, useState } from "react";
import type { QueryResult, SortSpec } from "@/lib/types";
import { formatCell } from "@/lib/format";

const ROW_H = 30;
const OVERSCAN = 8;
const DIM_W = 180;
const MEASURE_W = 130;

export default function DataGrid({
  result,
  loading,
  error,
  sorts,
  onToggleSort,
  onPage,
  pageSize,
  onPageSize,
}: {
  result: QueryResult | null;
  loading: boolean;
  error: string | null;
  sorts: SortSpec[];
  onToggleSort: (field: string) => void;
  onPage: (offset: number) => void;
  pageSize: number;
  onPageSize: (n: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(420);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewport(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // reset scroll when a new result page arrives
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [result]);

  if (error) {
    return (
      <div className="m-3 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
        <div className="mb-1 font-semibold">Sorgu hatası</div>
        <div className="font-mono text-xs">{error}</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-bi-dim">
        {loading
          ? "Çalıştırılıyor…"
          : "Tablo ve alan seçtiğinizde sonuç burada görünür."}
      </div>
    );
  }

  const { columns, rows, total, offset } = result;
  const colWidth = (role: string) => (role === "dimension" ? DIM_W : MEASURE_W);
  const totalWidth = columns.reduce((s, c) => s + colWidth(c.role), 0);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const visibleCount = Math.ceil(viewport / ROW_H) + OVERSCAN * 2;
  const endIndex = Math.min(rows.length, startIndex + visibleCount);
  const padTop = startIndex * ROW_H;
  const padBottom = (rows.length - endIndex) * ROW_H;

  const sortDir = (key: string) => sorts.find((s) => s.field === key)?.dir;

  const pageStart = rows.length ? offset + 1 : 0;
  const pageEnd = offset + rows.length;
  const canPrev = offset > 0;
  const canNext = offset + rows.length < total;

  return (
    <div className="flex h-full flex-col">
      {/* scroll viewport */}
      <div
        ref={scrollRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="relative flex-1 overflow-auto"
      >
        <div style={{ width: totalWidth, minWidth: "100%" }}>
          {/* header */}
          <div className="sticky top-0 z-10 flex border-b border-bi-border bg-bi-panel2">
            {columns.map((c) => {
              const dir = sortDir(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onToggleSort(c.key)}
                  style={{ width: colWidth(c.role) }}
                  className={`flex h-[34px] shrink-0 items-center gap-1 border-r border-bi-border px-2 text-left text-[11px] font-semibold uppercase tracking-wide hover:bg-bi-panel ${
                    c.role === "measure"
                      ? "justify-end text-bi-values"
                      : "text-bi-muted"
                  }`}
                  title={c.label}
                >
                  <span className="truncate">{c.label}</span>
                  <span className="text-bi-accent">
                    {dir === "ASC" ? "▲" : dir === "DESC" ? "▼" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {/* virtualized rows */}
          <div style={{ paddingTop: padTop, paddingBottom: padBottom }}>
            {rows.slice(startIndex, endIndex).map((row, i) => (
              <div
                key={startIndex + i}
                style={{ height: ROW_H }}
                className={`flex ${
                  (startIndex + i) % 2 ? "bg-bi-bg" : "bg-bi-panel/40"
                } hover:bg-bi-accent/5`}
              >
                {columns.map((c) => (
                  <div
                    key={c.key}
                    style={{ width: colWidth(c.role) }}
                    className={`flex shrink-0 items-center overflow-hidden border-r border-bi-border/50 px-2 text-xs ${
                      c.role === "measure"
                        ? "justify-end font-mono text-bi-text"
                        : "text-bi-text"
                    }`}
                  >
                    <span className="truncate">
                      {formatCell(row[c.key], c.type)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {rows.length === 0 && (
              <div className="p-6 text-center text-sm text-bi-dim">
                Sonuç bulunamadı.
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-bi-bg/40 pt-10">
            <span className="rounded-md bg-bi-panel2 px-3 py-1 text-xs text-bi-muted">
              Yükleniyor…
            </span>
          </div>
        )}
      </div>

      {/* footer / paging */}
      <div className="flex items-center justify-between gap-3 border-t border-bi-border bg-bi-panel2 px-3 py-1.5 text-xs text-bi-muted">
        <div className="flex items-center gap-3">
          <span>
            {pageStart.toLocaleString("tr-TR")}–{pageEnd.toLocaleString("tr-TR")}{" "}
            / {total.toLocaleString("tr-TR")} satır
          </span>
          <span className="text-bi-dim">{result.elapsedMs} ms</span>
          <button
            type="button"
            className="text-bi-dim underline-offset-2 hover:text-bi-text hover:underline"
            onClick={() => setShowSql((s) => !s)}
          >
            SQL
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded border border-bi-border bg-bi-panel px-1.5 py-1 text-xs text-bi-text outline-none"
          >
            {[25, 50, 100, 200, 500].map((n) => (
              <option key={n} value={n}>
                {n}/sayfa
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => onPage(Math.max(0, offset - pageSize))}
            className="rounded border border-bi-border px-2 py-1 hover:bg-bi-panel disabled:opacity-40"
          >
            ‹ Önceki
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => onPage(offset + pageSize)}
            className="rounded border border-bi-border px-2 py-1 hover:bg-bi-panel disabled:opacity-40"
          >
            Sonraki ›
          </button>
        </div>
      </div>

      {showSql && (
        <pre className="max-h-40 overflow-auto border-t border-bi-border bg-black/40 p-3 font-mono text-[11px] text-bi-muted">
          {result.sql}
        </pre>
      )}
    </div>
  );
}
