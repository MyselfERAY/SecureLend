"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type {
  Aggregation,
  ConnectionPublic,
  Dimension,
  Filter,
  Measure,
  QueryResult,
  ReportQuery,
  SortSpec,
  TableMeta,
  UserPublic,
} from "@/lib/types";
import FieldList from "./FieldList";
import { Shelf, Chip } from "./Shelf";
import FilterRow from "./FilterRow";
import DataGrid from "./DataGrid";
import ConnectionDialog from "./ConnectionDialog";
import ShareDialog from "./ShareDialog";
import type { DragPayload } from "./dnd";

const AGGS: Aggregation[] = ["SUM", "AVG", "MIN", "MAX", "COUNT", "COUNT_DISTINCT"];

interface ReportListItem {
  id: string;
  name: string;
  ownerName: string;
  permission: string;
  table: string;
}

export default function Editor({ user }: { user: UserPublic }) {
  const router = useRouter();

  // connections + schema
  const [connections, setConnections] = useState<ConnectionPublic[]>([]);
  const [connId, setConnId] = useState<string>("");
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [schemaName, setSchemaName] = useState<string>("");
  const [tableName, setTableName] = useState<string>("");
  const [tableSearch, setTableSearch] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);

  // query definition
  const [rows, setRows] = useState<Dimension[]>([]);
  const [columns, setColumns] = useState<Dimension[]>([]);
  const [values, setValues] = useState<Measure[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sorts, setSorts] = useState<SortSpec[]>([]);

  // execution
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(50);

  // saved reports
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportName, setReportName] = useState("Adsız rapor");
  const [reportPerm, setReportPerm] = useState<string>("owner");

  // modals
  const [showConn, setShowConn] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReports, setShowReports] = useState(false);

  const table = useMemo(
    () => tables.find((t) => t.name === tableName) ?? null,
    [tables, tableName],
  );

  const reqId = useRef(0);

  // --- initial load -------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const [conns, reps] = await Promise.all([api.connections(), api.reports()]);
        setConnections(conns);
        setReports(reps);
        if (conns.length) setConnId(conns[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Yüklenemedi");
      }
    })();
  }, []);

  // --- load schema when connection changes --------------------------------
  const loadSchema = useCallback(async (id: string) => {
    if (!id) return;
    setSchemaLoading(true);
    try {
      const res = await api.schema(id);
      setTables(res.tables);
      setSchemaName(res.schema);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Şema yüklenemedi");
      setTables([]);
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connId) loadSchema(connId);
  }, [connId, loadSchema]);

  // --- query builder from state -------------------------------------------
  const buildQuery = useCallback((): ReportQuery | null => {
    if (!connId || !tableName || !schemaName) return null;
    if (rows.length === 0 && values.length === 0) return null;
    return {
      connectionId: connId,
      schema: schemaName,
      table: tableName,
      rows,
      columns,
      values,
      filters: filters.filter((f) => f.column),
      sorts,
    };
  }, [connId, tableName, schemaName, rows, columns, values, filters, sorts]);

  const run = useCallback(
    async (offset: number) => {
      const query = buildQuery();
      if (!query) {
        setResult(null);
        return;
      }
      const id = ++reqId.current;
      setLoading(true);
      setError(null);
      try {
        const res = await api.runQuery(query, { offset, limit: pageSize });
        if (id === reqId.current) setResult(res);
      } catch (e) {
        if (id === reqId.current) {
          setError(e instanceof Error ? e.message : "Sorgu başarısız");
          setResult(null);
        }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [buildQuery, pageSize],
  );

  // auto-run (debounced) when the definition changes
  const defKey = JSON.stringify({
    connId,
    schemaName,
    tableName,
    rows,
    columns,
    values,
    filters,
    sorts,
    pageSize,
  });
  useEffect(() => {
    const t = setTimeout(() => run(0), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defKey]);

  // --- shelf drop handlers ------------------------------------------------
  const addDimension = (set: typeof setRows, p: DragPayload) =>
    set((prev) =>
      prev.some((d) => d.column === p.column) ? prev : [...prev, { column: p.column }],
    );

  const addValue = (p: DragPayload) =>
    setValues((prev) =>
      prev.some((m) => m.column === p.column && !m.alias)
        ? prev
        : [...prev, { column: p.column, agg: p.type === "number" ? "SUM" : "COUNT" }],
    );

  const addFilter = (p: DragPayload) =>
    setFilters((prev) => [...prev, { column: p.column, op: "=", value: "" }]);

  // --- sorting ------------------------------------------------------------
  const toggleSort = (field: string) => {
    setSorts((prev) => {
      const cur = prev.find((s) => s.field === field);
      if (!cur) return [{ field, dir: "ASC" }];
      if (cur.dir === "ASC") return [{ field, dir: "DESC" }];
      return [];
    });
  };

  // --- reset / new --------------------------------------------------------
  const resetReport = () => {
    setRows([]);
    setColumns([]);
    setValues([]);
    setFilters([]);
    setSorts([]);
    setResult(null);
    setReportId(null);
    setReportName("Adsız rapor");
    setReportPerm("owner");
  };

  // --- save / load --------------------------------------------------------
  const save = async () => {
    const query = buildQuery();
    if (!query) {
      setError("Kaydetmeden önce en az bir satır veya değer ekleyin");
      return;
    }
    try {
      if (reportId && (reportPerm === "owner" || reportPerm === "edit")) {
        await api.updateReport(reportId, reportName, query);
      } else {
        const created = await api.createReport(reportName, query);
        setReportId(created.id);
        setReportPerm("owner");
      }
      setReports(await api.reports());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    }
  };

  const loadReport = async (id: string) => {
    setShowReports(false);
    try {
      const r = await api.getReport(id);
      const q = r.query;
      setConnId(q.connectionId);
      await loadSchema(q.connectionId);
      setSchemaName(q.schema);
      setTableName(q.table);
      setRows(q.rows);
      setColumns(q.columns);
      setValues(q.values);
      setFilters(q.filters);
      setSorts(q.sorts);
      setReportId(r.id);
      setReportName(r.name);
      setReportPerm(r.permission);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rapor yüklenemedi");
    }
  };

  const removeReport = async (id: string) => {
    try {
      await api.deleteReport(id);
      setReports(await api.reports());
      if (reportId === id) resetReport();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    }
  };

  const logout = async () => {
    await api.logout();
    router.replace("/login");
  };

  const filteredTables = useMemo(() => {
    const n = tableSearch.trim().toLowerCase();
    return n ? tables.filter((t) => t.name.toLowerCase().includes(n)) : tables;
  }, [tables, tableSearch]);

  const canEdit = reportPerm === "owner" || reportPerm === "edit" || !reportId;
  const canShare = reportId && reportPerm === "owner";

  return (
    <div className="flex h-screen flex-col bg-bi-bg text-bi-text">
      {/* ---- header ---- */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-bi-border bg-bi-panel px-3">
        <span className="font-semibold">SecureLend BI</span>

        <select
          value={connId}
          onChange={(e) => {
            setConnId(e.target.value);
            setTableName("");
            resetReport();
          }}
          className="rounded-md border border-bi-border bg-bi-panel2 px-2 py-1.5 text-sm text-bi-text outline-none"
        >
          {connections.length === 0 && <option value="">Bağlantı yok</option>}
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowConn(true)}
          className="rounded-md border border-bi-border px-2 py-1.5 text-sm text-bi-muted hover:bg-bi-panel2"
        >
          + Bağlantı
        </button>

        <input
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          disabled={!canEdit}
          className="ml-2 w-52 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-bi-text outline-none hover:border-bi-border focus:border-bi-accent disabled:opacity-60"
        />

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReports((s) => !s)}
              className="rounded-md border border-bi-border px-2 py-1.5 text-sm text-bi-muted hover:bg-bi-panel2"
            >
              Raporlar ▾
            </button>
            {showReports && (
              <div className="absolute right-0 z-30 mt-1 max-h-80 w-72 overflow-auto rounded-lg border border-bi-border bg-bi-panel shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    resetReport();
                    setShowReports(false);
                  }}
                  className="block w-full border-b border-bi-border px-3 py-2 text-left text-sm text-bi-accent hover:bg-bi-panel2"
                >
                  + Yeni rapor
                </button>
                {reports.length === 0 && (
                  <div className="px-3 py-3 text-xs text-bi-dim">
                    Kayıtlı rapor yok.
                  </div>
                )}
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 border-b border-bi-border px-3 py-2 last:border-0 hover:bg-bi-panel2"
                  >
                    <button
                      type="button"
                      onClick={() => loadReport(r.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm text-bi-text">{r.name}</div>
                      <div className="truncate text-[11px] text-bi-dim">
                        {r.table} · {r.ownerName}
                        {r.permission !== "owner" && ` · ${r.permission}`}
                      </div>
                    </button>
                    {(r.permission === "owner") && (
                      <button
                        type="button"
                        onClick={() => removeReport(r.id)}
                        className="rounded px-1 text-bi-dim hover:text-red-300"
                        title="Sil"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={save}
            disabled={!canEdit}
            className="rounded-md bg-bi-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-bi-accent2 disabled:opacity-50"
          >
            Kaydet
          </button>
          {canShare && (
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="rounded-md border border-bi-border px-2 py-1.5 text-sm text-bi-muted hover:bg-bi-panel2"
            >
              Paylaş
            </button>
          )}

          <div className="ml-1 flex items-center gap-2 border-l border-bi-border pl-2">
            <span className="text-sm text-bi-muted">{user.username}</span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-bi-dim hover:text-bi-text"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* ---- body ---- */}
      <div className="flex min-h-0 flex-1">
        {/* left: tables + fields */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-bi-border bg-bi-panel">
          <div className="flex h-1/3 min-h-0 flex-col border-b border-bi-border">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-bi-muted">
                Tablolar {schemaName && `· ${schemaName}`}
              </span>
              {schemaLoading && <span className="text-[10px] text-bi-dim">…</span>}
            </div>
            <div className="px-2 pb-2">
              <input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Tablo ara…"
                className="w-full rounded-md border border-bi-border bg-bi-panel2 px-2 py-1.5 text-xs text-bi-text outline-none focus:border-bi-accent"
              />
            </div>
            <div className="flex-1 overflow-auto px-1.5 pb-2">
              {filteredTables.map((t) => (
                <button
                  key={`${t.schema}.${t.name}`}
                  type="button"
                  onClick={() => {
                    resetReport();
                    setTableName(t.name);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-bi-panel2 ${
                    tableName === t.name ? "bg-bi-accent/15 text-bi-accent" : "text-bi-text"
                  }`}
                >
                  <span className="text-[10px] text-bi-dim">
                    {t.kind === "VIEW" ? "V" : "T"}
                  </span>
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
              {!schemaLoading && filteredTables.length === 0 && (
                <div className="px-2 py-3 text-xs text-bi-dim">Tablo yok.</div>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-bi-muted">
              Alanlar
            </div>
            <div className="h-[calc(100%-2.25rem)]">
              <FieldList table={table} />
            </div>
          </div>
        </aside>

        {/* center: shelves + grid */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="grid grid-cols-4 gap-2 border-b border-bi-border bg-bi-panel2/40 p-2">
            <Shelf
              zone="rows"
              title="Satırlar"
              hint="grup"
              empty={rows.length === 0}
              onDropField={(p) => addDimension(setRows, p)}
            >
              {rows.map((d) => (
                <Chip
                  key={d.column}
                  label={d.column}
                  color="text-bi-rows"
                  onRemove={() =>
                    setRows((prev) => prev.filter((x) => x.column !== d.column))
                  }
                />
              ))}
            </Shelf>

            <Shelf
              zone="columns"
              title="Sütunlar"
              hint="pivot · max 1"
              empty={columns.length === 0}
              onDropField={(p) =>
                setColumns((prev) =>
                  prev.some((d) => d.column === p.column)
                    ? prev
                    : [{ column: p.column }],
                )
              }
            >
              {columns.map((d) => (
                <Chip
                  key={d.column}
                  label={d.column}
                  color="text-bi-cols"
                  onRemove={() => setColumns([])}
                />
              ))}
            </Shelf>

            <Shelf
              zone="values"
              title="Değerler"
              hint="agregasyon"
              empty={values.length === 0}
              onDropField={addValue}
            >
              {values.map((m, i) => (
                <Chip
                  key={`${m.column}-${i}`}
                  label={m.column}
                  color="text-bi-values"
                  onRemove={() =>
                    setValues((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  <select
                    value={m.agg}
                    onChange={(e) =>
                      setValues((prev) =>
                        prev.map((x, idx) =>
                          idx === i
                            ? { ...x, agg: e.target.value as Aggregation }
                            : x,
                        ),
                      )
                    }
                    className="rounded border border-bi-border bg-bi-panel px-1 py-0.5 text-[10px] text-bi-muted outline-none"
                  >
                    {AGGS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Chip>
              ))}
            </Shelf>

            <Shelf
              zone="filters"
              title="Filtreler"
              hint="WHERE"
              empty={filters.length === 0}
              onDropField={addFilter}
            >
              {filters.map((f, i) => (
                <FilterRow
                  key={i}
                  filter={f}
                  table={table}
                  onChange={(nf) =>
                    setFilters((prev) => prev.map((x, idx) => (idx === i ? nf : x)))
                  }
                  onRemove={() =>
                    setFilters((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </Shelf>
          </div>

          <div className="min-h-0 flex-1">
            <DataGrid
              result={result}
              loading={loading}
              error={error}
              sorts={sorts}
              onToggleSort={toggleSort}
              onPage={(offset) => run(offset)}
              pageSize={pageSize}
              onPageSize={setPageSize}
            />
          </div>
        </main>
      </div>

      {showConn && (
        <ConnectionDialog
          onClose={() => setShowConn(false)}
          onCreated={(c) => {
            setConnections((prev) => [...prev, c]);
            setConnId(c.id);
            setShowConn(false);
          }}
        />
      )}
      {showShare && reportId && (
        <ShareDialog
          reportId={reportId}
          reportName={reportName}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
