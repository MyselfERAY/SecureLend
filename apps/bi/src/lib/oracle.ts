import oracledb from "oracledb";
import { decryptSecret } from "./crypto";
import type {
  ColumnMeta,
  ColumnType,
  Connection,
  TableMeta,
} from "./types";

// ---------------------------------------------------------------------------
// Oracle access layer. Uses oracledb in *thin mode* (the default in v6+), so no
// Oracle Instant Client install is required. One connection pool per saved
// connection id, cached for the life of the process.
// ---------------------------------------------------------------------------

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// Return LOBs and large numbers as strings to keep JSON serialization sane.
oracledb.fetchAsString = [oracledb.CLOB];

const pools = new Map<string, Promise<oracledb.Pool>>();

function connectString(c: Connection): string {
  if (c.serviceName) return `${c.host}:${c.port}/${c.serviceName}`;
  if (c.sid) {
    return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${c.host})(PORT=${c.port}))(CONNECT_DATA=(SID=${c.sid})))`;
  }
  throw new Error("Bağlantıda serviceName veya sid belirtilmeli");
}

async function getPool(c: Connection): Promise<oracledb.Pool> {
  let p = pools.get(c.id);
  if (!p) {
    p = oracledb.createPool({
      user: c.user,
      password: decryptSecret(c.passwordEnc),
      connectString: connectString(c),
      poolMin: 0,
      poolMax: 4,
      poolTimeout: 60,
      queueTimeout: 15000,
    });
    pools.set(c.id, p);
    // If pool creation fails, don't cache the rejected promise.
    p.catch(() => pools.delete(c.id));
  }
  return p;
}

/** Drop a cached pool (call after a connection is edited or deleted). */
export async function closePool(connectionId: string): Promise<void> {
  const p = pools.get(connectionId);
  pools.delete(connectionId);
  if (!p) return;
  try {
    const pool = await p;
    await pool.close(5);
  } catch {
    /* ignore */
  }
}

export interface QueryRunOptions {
  maxRows?: number;
}

export async function runQuery<T = Record<string, unknown>>(
  c: Connection,
  sql: string,
  binds: Record<string, unknown> = {},
  opts: QueryRunOptions = {},
): Promise<T[]> {
  const pool = await getPool(c);
  const conn = await pool.getConnection();
  try {
    const res = await conn.execute<T>(sql, binds, {
      maxRows: opts.maxRows ?? 0,
    });
    return res.rows ?? [];
  } finally {
    await conn.close();
  }
}

/** Validate that the connection works (used by the "test" button). */
export async function testConnection(c: Connection): Promise<void> {
  await runQuery(c, "SELECT 1 AS ok FROM dual", {}, { maxRows: 1 });
}

// --- Schema introspection --------------------------------------------------

function normalizeType(oracleType: string): ColumnType {
  const t = oracleType.toUpperCase();
  if (/(NUMBER|FLOAT|INTEGER|DECIMAL|DOUBLE|BINARY_FLOAT|BINARY_DOUBLE)/.test(t))
    return "number";
  if (/(DATE|TIMESTAMP)/.test(t)) return "date";
  if (/(CHAR|CLOB|VARCHAR|VARCHAR2|NVARCHAR|NCHAR|TEXT)/.test(t)) return "string";
  return "other";
}

export function defaultSchemaOf(c: Connection): string {
  return (c.defaultSchema || c.user).toUpperCase();
}

interface SchemaCacheEntry {
  at: number;
  tables: TableMeta[];
}
const SCHEMA_TTL_MS = 60_000;
const schemaCache = new Map<string, SchemaCacheEntry>();

/** List tables + views + columns for a schema (cached briefly). */
export async function getSchema(
  c: Connection,
  schema?: string,
  force = false,
): Promise<TableMeta[]> {
  const owner = (schema || defaultSchemaOf(c)).toUpperCase();
  const cacheKey = `${c.id}:${owner}`;
  const cached = schemaCache.get(cacheKey);
  if (!force && cached && Date.now() - cached.at < SCHEMA_TTL_MS) {
    return cached.tables;
  }

  const objects = await runQuery<{ NAME: string; KIND: string }>(
    c,
    `SELECT table_name AS name, 'TABLE' AS kind FROM all_tables WHERE owner = :owner
     UNION ALL
     SELECT view_name AS name, 'VIEW' AS kind FROM all_views WHERE owner = :owner
     ORDER BY name`,
    { owner },
  );

  const cols = await runQuery<{
    TABLE_NAME: string;
    COLUMN_NAME: string;
    DATA_TYPE: string;
    NULLABLE: string;
  }>(
    c,
    `SELECT table_name, column_name, data_type, nullable
     FROM all_tab_columns WHERE owner = :owner
     ORDER BY table_name, column_id`,
    { owner },
  );

  const byTable = new Map<string, ColumnMeta[]>();
  for (const row of cols) {
    const list = byTable.get(row.TABLE_NAME) ?? [];
    list.push({
      name: row.COLUMN_NAME,
      oracleType: row.DATA_TYPE,
      type: normalizeType(row.DATA_TYPE),
      nullable: row.NULLABLE === "Y",
    });
    byTable.set(row.TABLE_NAME, list);
  }

  const tables: TableMeta[] = objects.map((o) => ({
    schema: owner,
    name: o.NAME,
    kind: o.KIND === "VIEW" ? "VIEW" : "TABLE",
    columns: byTable.get(o.NAME) ?? [],
  }));

  schemaCache.set(cacheKey, { at: Date.now(), tables });
  return tables;
}

export function invalidateSchema(connectionId: string): void {
  for (const key of schemaCache.keys()) {
    if (key.startsWith(`${connectionId}:`)) schemaCache.delete(key);
  }
}
