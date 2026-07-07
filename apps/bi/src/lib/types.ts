// ---------------------------------------------------------------------------
// Shared BI domain types — used by both server (route handlers) and client.
// ---------------------------------------------------------------------------

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  passwordHash: string; // scrypt: salt:hash (hex)
  createdAt: string;
}

/** Public-safe view of a user (no password hash). */
export interface UserPublic {
  id: string;
  username: string;
  role: UserRole;
}

// --- Oracle connections ----------------------------------------------------

export interface ConnectionInput {
  name: string;
  host: string;
  port: number;
  /** Oracle service name (preferred) or SID. */
  serviceName?: string;
  sid?: string;
  user: string;
  password?: string; // only on create/update; never returned to client
  /** Default schema to introspect (defaults to connection user, uppercased). */
  defaultSchema?: string;
}

export interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  serviceName?: string;
  sid?: string;
  user: string;
  defaultSchema?: string;
  /** AES-256-GCM encrypted password (iv:tag:ciphertext hex). Server-only. */
  passwordEnc: string;
  ownerId: string;
  createdAt: string;
}

/** Connection without secrets, safe to send to the client. */
export interface ConnectionPublic {
  id: string;
  name: string;
  host: string;
  port: number;
  serviceName?: string;
  sid?: string;
  user: string;
  defaultSchema?: string;
  ownerId: string;
}

// --- Schema metadata -------------------------------------------------------

export type ColumnType = "string" | "number" | "date" | "other";

export interface ColumnMeta {
  name: string; // upper-case Oracle identifier
  oracleType: string; // raw DATA_TYPE, e.g. VARCHAR2, NUMBER, DATE
  type: ColumnType; // normalized bucket used by the UI
  nullable: boolean;
}

export interface TableMeta {
  schema: string;
  name: string;
  kind: "TABLE" | "VIEW";
  columns: ColumnMeta[];
}

// --- Report definition (the drag-drop result) -----------------------------

export type Aggregation =
  | "SUM"
  | "AVG"
  | "MIN"
  | "MAX"
  | "COUNT"
  | "COUNT_DISTINCT";

export type FilterOp =
  | "="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "IN"
  | "NOT IN"
  | "LIKE"
  | "BETWEEN"
  | "IS NULL"
  | "IS NOT NULL";

/** A dimension placed in Rows or Columns. */
export interface Dimension {
  column: string;
}

/** A measure placed in Values. */
export interface Measure {
  column: string; // ignored (use "*") for plain COUNT
  agg: Aggregation;
  /** Output alias; auto-generated if absent. */
  alias?: string;
}

export interface Filter {
  column: string;
  op: FilterOp;
  /** Single value for =, !=, >, LIKE, etc. */
  value?: string | number;
  /** For IN / NOT IN. */
  values?: (string | number)[];
  /** For BETWEEN [lo, hi]. */
  range?: [string | number, string | number];
}

export interface SortSpec {
  /** Output field key (dimension column or measure alias). */
  field: string;
  dir: "ASC" | "DESC";
}

export interface ReportQuery {
  connectionId: string;
  schema: string;
  table: string;
  rows: Dimension[];
  columns: Dimension[]; // 0 or 1 supported for true server-side pivot
  values: Measure[];
  filters: Filter[];
  sorts: SortSpec[];
}

export interface PageRequest {
  offset: number;
  limit: number;
}

// --- Query result ----------------------------------------------------------

export interface ResultColumn {
  key: string; // field key in each row object
  label: string; // header text
  type: ColumnType;
  /** "dimension" (row header) or "measure" (numeric value). */
  role: "dimension" | "measure";
  /** For pivoted measure columns: the pivot value this column belongs to. */
  pivotValue?: string;
}

export interface QueryResult {
  columns: ResultColumn[];
  rows: Record<string, unknown>[];
  total: number; // total distinct row-groups (for paging)
  offset: number;
  limit: number;
  /** The SQL that was executed (with bind placeholders), for transparency. */
  sql: string;
  elapsedMs: number;
}

// --- Saved reports + sharing ----------------------------------------------

export type SharePermission = "view" | "edit";

export interface ReportShare {
  userId: string;
  permission: SharePermission;
}

export interface SavedReport {
  id: string;
  name: string;
  ownerId: string;
  query: ReportQuery;
  shares: ReportShare[];
  createdAt: string;
  updatedAt: string;
}

// --- API envelope (JSend-ish, matches the rest of the monorepo) ------------

export type ApiResult<T> =
  | { status: "success"; data: T }
  | { status: "fail" | "error"; message: string };
