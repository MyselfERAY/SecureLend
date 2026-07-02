import { getSchema, runQuery } from "./oracle";
import { build, buildPivotValuesQuery, clampLimit, QueryError } from "./query-builder";
import type { Connection, PageRequest, QueryResult, ReportQuery } from "./types";

// ---------------------------------------------------------------------------
// Orchestrates a full report run against Oracle:
//   1. load (cached) schema for validation
//   2. if pivoting, resolve distinct pivot-column values (server-side, capped)
//   3. build safe SQL (data + count) and execute
//   4. normalize rows into JSON-safe values
// ---------------------------------------------------------------------------

function normalizeValue(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "bigint") return Number(v);
  return v;
}

export async function runReport(
  conn: Connection,
  query: ReportQuery,
  page: PageRequest,
): Promise<QueryResult> {
  const startedAt = Date.now();
  const schema = await getSchema(conn, query.schema);

  // 1. resolve pivot values if a column dimension is present
  let pivotValues: string[] | undefined;
  if (query.columns.length > 0) {
    const pv = buildPivotValuesQuery(query, schema);
    const rows = await runQuery<{ V: unknown }>(conn, pv.sql, pv.binds);
    pivotValues = rows
      .map((r) => r.V)
      .filter((v) => v !== null && v !== undefined)
      .map((v) => (v instanceof Date ? v.toISOString() : String(v)));
  }

  // 2. build the SQL
  const built = build({
    query,
    schema,
    pivotValues,
    offset: page.offset,
    limit: clampLimit(page.limit),
  });

  // 3. execute count + data
  const [countRows, dataRows] = await Promise.all([
    runQuery<{ CNT: number }>(conn, built.countSql, built.binds),
    runQuery<Record<string, unknown>>(conn, built.dataSql, built.binds),
  ]);

  const total = built.countSql.includes("FROM dual")
    ? dataRows.length
    : Number(countRows[0]?.CNT ?? 0);

  // 4. normalize rows
  const rows = dataRows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of built.columns) out[col.key] = normalizeValue(row[col.key]);
    return out;
  });

  return {
    columns: built.columns,
    rows,
    total,
    offset: Math.max(0, Math.floor(page.offset)),
    limit: clampLimit(page.limit),
    sql: built.dataSql,
    elapsedMs: Date.now() - startedAt,
  };
}

export { QueryError };
