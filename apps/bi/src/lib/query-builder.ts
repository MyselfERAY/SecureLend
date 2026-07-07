import type {
  Aggregation,
  ColumnMeta,
  ColumnType,
  Filter,
  FilterOp,
  Measure,
  ReportQuery,
  ResultColumn,
  SortSpec,
  TableMeta,
} from "./types";

// ---------------------------------------------------------------------------
// Safe SQL builder.
//
// Security model:
//   * Identifiers (schema / table / column names) can NOT be bound — instead
//     every identifier is validated against the *live* schema metadata and
//     double-quoted. Anything not present in the schema is rejected.
//   * All literal values flow through bind variables (:b0, :b1, ...).
//   * Aggregation functions and filter operators come from fixed whitelists.
//
// Pivoting is done with conditional aggregation (CASE WHEN), which works on any
// Oracle version and keeps row-group paging intact.
// ---------------------------------------------------------------------------

const AGGS: Record<Aggregation, true> = {
  SUM: true,
  AVG: true,
  MIN: true,
  MAX: true,
  COUNT: true,
  COUNT_DISTINCT: true,
};

const VALUE_OPS: Record<FilterOp, true> = {
  "=": true,
  "!=": true,
  ">": true,
  ">=": true,
  "<": true,
  "<=": true,
  IN: true,
  "NOT IN": true,
  LIKE: true,
  BETWEEN: true,
  "IS NULL": true,
  "IS NOT NULL": true,
};

export class QueryError extends Error {}

export interface BuiltQuery {
  dataSql: string;
  countSql: string;
  binds: Record<string, unknown>;
  columns: ResultColumn[];
  /** Distinct pivot values resolved (empty when not pivoting). */
  pivotValues: string[];
  /** True when the requested pivot cardinality was capped. */
  pivotTruncated: boolean;
}

interface BindBag {
  binds: Record<string, unknown>;
  next: () => string;
}

function newBindBag(): BindBag {
  const binds: Record<string, unknown> = {};
  let i = 0;
  return {
    binds,
    next: () => `b${i++}`,
  };
}

const MAX_PIVOT_VALUES = 50;

function maxPageSize(): number {
  const v = Number(process.env.BI_MAX_PAGE_SIZE);
  return Number.isFinite(v) && v > 0 ? v : 500;
}

export function clampLimit(limit: number): number {
  const n = Math.floor(limit);
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.min(n, maxPageSize());
}

/** Resolve + validate the source table against schema metadata. */
function resolveTable(q: ReportQuery, schema: TableMeta[]): TableMeta {
  const wantName = q.table.toUpperCase();
  const wantSchema = q.schema.toUpperCase();
  const t = schema.find(
    (x) => x.name.toUpperCase() === wantName && x.schema.toUpperCase() === wantSchema,
  );
  if (!t) throw new QueryError(`Bilinmeyen tablo: ${q.schema}.${q.table}`);
  return t;
}

/** Quote + validate a column name against the table. Returns the SQL fragment. */
function qcol(name: string, table: TableMeta): string {
  const col = table.columns.find(
    (c) => c.name.toUpperCase() === name.toUpperCase(),
  );
  if (!col) throw new QueryError(`Bilinmeyen kolon: ${name}`);
  return `"${col.name}"`;
}

function colMeta(name: string, table: TableMeta): ColumnMeta {
  const col = table.columns.find(
    (c) => c.name.toUpperCase() === name.toUpperCase(),
  );
  if (!col) throw new QueryError(`Bilinmeyen kolon: ${name}`);
  return col;
}

/** Coerce a bind value to a sensible JS type for its target column. */
function coerce(value: unknown, type: ColumnType): unknown {
  if (value === null || value === undefined) return value;
  if (type === "number") {
    const n = Number(value);
    if (Number.isNaN(n)) throw new QueryError(`Sayısal değer beklendi: ${value}`);
    return n;
  }
  return String(value);
}

/** Build a single aggregate expression (no pivot). */
function aggExpr(m: Measure, table: TableMeta): string {
  if (m.agg === "COUNT") {
    if (!m.column || m.column === "*") return "COUNT(*)";
    return `COUNT(${qcol(m.column, table)})`;
  }
  if (m.agg === "COUNT_DISTINCT") {
    return `COUNT(DISTINCT ${qcol(m.column, table)})`;
  }
  if (!(m.agg in AGGS)) throw new QueryError(`Geçersiz agregasyon: ${m.agg}`);
  return `${m.agg}(${qcol(m.column, table)})`;
}

/** Build a pivoted (conditional) aggregate expression for one pivot value. */
function pivotAggExpr(
  m: Measure,
  pivotCol: string,
  pivotBind: string,
  table: TableMeta,
): string {
  const cond = `${qcol(pivotCol, table)} = :${pivotBind}`;
  if (m.agg === "COUNT") {
    const inner = !m.column || m.column === "*" ? "1" : qcol(m.column, table);
    return `COUNT(CASE WHEN ${cond} THEN ${inner} END)`;
  }
  if (m.agg === "COUNT_DISTINCT") {
    return `COUNT(DISTINCT CASE WHEN ${cond} THEN ${qcol(m.column, table)} END)`;
  }
  return `${m.agg}(CASE WHEN ${cond} THEN ${qcol(m.column, table)} END)`;
}

function measureLabel(m: Measure): string {
  if (m.alias) return m.alias;
  if (m.agg === "COUNT" && (!m.column || m.column === "*")) return "COUNT(*)";
  if (m.agg === "COUNT_DISTINCT") return `COUNT(DISTINCT ${m.column})`;
  return `${m.agg}(${m.column})`;
}

/** Build the WHERE clause from filters using bind variables. */
function buildWhere(
  filters: Filter[],
  table: TableMeta,
  bag: BindBag,
): string {
  if (!filters.length) return "";
  const parts: string[] = [];
  for (const f of filters) {
    if (!(f.op in VALUE_OPS)) throw new QueryError(`Geçersiz operatör: ${f.op}`);
    const col = qcol(f.column, table);
    const meta = colMeta(f.column, table);

    // wrap a date column bound as a YYYY-MM-DD string
    const bindRef = (raw: unknown): string => {
      const name = bag.next();
      if (meta.type === "date" && typeof raw === "string") {
        bag.binds[name] = raw;
        return `TO_DATE(:${name}, 'YYYY-MM-DD')`;
      }
      bag.binds[name] = coerce(raw, meta.type);
      return `:${name}`;
    };

    switch (f.op) {
      case "IS NULL":
        parts.push(`${col} IS NULL`);
        break;
      case "IS NOT NULL":
        parts.push(`${col} IS NOT NULL`);
        break;
      case "IN":
      case "NOT IN": {
        const vals = f.values ?? [];
        if (!vals.length) throw new QueryError(`${f.op} için değer listesi gerekli`);
        const refs = vals.map((v) => bindRef(v));
        parts.push(`${col} ${f.op} (${refs.join(", ")})`);
        break;
      }
      case "BETWEEN": {
        if (!f.range) throw new QueryError("BETWEEN için aralık gerekli");
        parts.push(`${col} BETWEEN ${bindRef(f.range[0])} AND ${bindRef(f.range[1])}`);
        break;
      }
      case "LIKE":
        parts.push(`${col} LIKE ${bindRef(f.value ?? "")}`);
        break;
      default:
        if (f.value === undefined) throw new QueryError(`${f.op} için değer gerekli`);
        parts.push(`${col} ${f.op} ${bindRef(f.value)}`);
    }
  }
  return `WHERE ${parts.join(" AND ")}`;
}

function dimAlias(i: number): string {
  return `D${i}`;
}
function measAlias(i: number): string {
  return `M${i}`;
}
function pivotMeasAlias(pi: number, mi: number): string {
  return `P${pi}M${mi}`;
}

export interface BuildInput {
  query: ReportQuery;
  schema: TableMeta[];
  /** Resolved distinct pivot values (when columns has 1 dim). */
  pivotValues?: string[];
  offset: number;
  limit: number;
}

/**
 * Build the distinct-values query used to discover pivot columns. Returns the
 * SQL + binds; the caller executes it and feeds the values back into build().
 */
export function buildPivotValuesQuery(
  query: ReportQuery,
  schema: TableMeta[],
): { sql: string; binds: Record<string, unknown>; column: string } {
  const table = resolveTable(query, schema);
  if (!query.columns.length) throw new QueryError("Pivot kolonu yok");
  const pivotCol = query.columns[0].column;
  const col = qcol(pivotCol, table);
  const bag = newBindBag();
  const where = buildWhere(query.filters, table, bag);
  // append the not-null guard onto whatever WHERE we already have
  const guard = where ? `${where} AND ${col} IS NOT NULL` : `WHERE ${col} IS NOT NULL`;
  const sql =
    `SELECT DISTINCT ${col} AS v FROM "${table.schema}"."${table.name}" ${guard} ` +
    `ORDER BY v FETCH FIRST ${MAX_PIVOT_VALUES + 1} ROWS ONLY`;
  return { sql, binds: bag.binds, column: pivotCol };
}

export function build(input: BuildInput): BuiltQuery {
  const { query, schema } = input;
  const table = resolveTable(query, schema);
  const bag = newBindBag();

  const where = buildWhere(query.filters, table, bag);
  const from = `FROM "${table.schema}"."${table.name}" ${where}`.trim();

  const selectParts: string[] = [];
  const groupParts: string[] = [];
  const columns: ResultColumn[] = [];

  // --- row dimensions ---
  query.rows.forEach((d, i) => {
    const expr = qcol(d.column, table);
    const alias = dimAlias(i);
    selectParts.push(`${expr} AS ${alias}`);
    groupParts.push(expr);
    const meta = colMeta(d.column, table);
    columns.push({
      key: alias,
      label: d.column,
      type: meta.type,
      role: "dimension",
    });
  });

  const hasPivot = query.columns.length > 0;
  let pivotValues: string[] = [];
  let pivotTruncated = false;

  if (hasPivot) {
    const pivotCol = query.columns[0].column;
    // validate pivot column exists
    qcol(pivotCol, table);
    const incoming = input.pivotValues ?? [];
    pivotTruncated = incoming.length > MAX_PIVOT_VALUES;
    pivotValues = incoming.slice(0, MAX_PIVOT_VALUES);

    pivotValues.forEach((pv, pi) => {
      const pvBind = bag.next();
      bag.binds[pvBind] = pv;
      query.values.forEach((m, mi) => {
        const alias = pivotMeasAlias(pi, mi);
        selectParts.push(`${pivotAggExpr(m, pivotCol, pvBind, table)} AS ${alias}`);
        columns.push({
          key: alias,
          label: `${pv} · ${measureLabel(m)}`,
          type: "number",
          role: "measure",
          pivotValue: pv,
        });
      });
    });
  } else {
    // --- plain measures ---
    query.values.forEach((m, mi) => {
      const alias = measAlias(mi);
      selectParts.push(`${aggExpr(m, table)} AS ${alias}`);
      columns.push({
        key: alias,
        label: measureLabel(m),
        type: "number",
        role: "measure",
      });
    });
  }

  if (!selectParts.length) {
    throw new QueryError("Raporda en az bir alan (satır veya değer) olmalı");
  }

  const groupBy = groupParts.length ? `GROUP BY ${groupParts.join(", ")}` : "";

  // --- ordering (only by known output keys; default by dimensions) ---
  const validKeys = new Set(columns.map((c) => c.key));
  const orderParts: string[] = [];
  for (const s of query.sorts as SortSpec[]) {
    if (validKeys.has(s.field)) {
      orderParts.push(`${s.field} ${s.dir === "DESC" ? "DESC" : "ASC"}`);
    }
  }
  if (!orderParts.length && groupParts.length) {
    query.rows.forEach((_, i) => orderParts.push(`${dimAlias(i)} ASC`));
  }
  const orderBy = orderParts.length ? `ORDER BY ${orderParts.join(", ")}` : "";

  // --- paging (only meaningful when grouping by row dimensions) ---
  const paged = groupParts.length > 0;
  let pageClause = "";
  if (paged) {
    const offBind = bag.next();
    const limBind = bag.next();
    bag.binds[offBind] = Math.max(0, Math.floor(input.offset));
    bag.binds[limBind] = clampLimit(input.limit);
    pageClause = `OFFSET :${offBind} ROWS FETCH NEXT :${limBind} ROWS ONLY`;
  }

  const dataSql = [
    `SELECT ${selectParts.join(", ")}`,
    from,
    groupBy,
    orderBy,
    pageClause,
  ]
    .filter(Boolean)
    .join("\n");

  // --- count of row-groups (for paging) ---
  const countSql = paged
    ? `SELECT COUNT(*) AS CNT FROM (SELECT 1 ${from} ${groupBy})`
    : `SELECT 1 AS CNT FROM dual`;

  return {
    dataSql,
    countSql,
    binds: bag.binds,
    columns,
    pivotValues,
    pivotTruncated,
  };
}
