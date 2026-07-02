import type {
  ColumnMeta,
  ConnectionInput,
  ConnectionPublic,
  PageRequest,
  QueryResult,
  ReportQuery,
  SavedReport,
  SharePermission,
  TableMeta,
  UserPublic,
  UserRole,
} from "./types";

// ---------------------------------------------------------------------------
// Browser-side API client. All calls hit the app's own route handlers and use
// the httpOnly session cookie automatically.
// ---------------------------------------------------------------------------

async function call<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const opts: RequestInit = {
    method: init?.method ?? (init?.json ? "POST" : "GET"),
    headers: init?.json ? { "Content-Type": "application/json" } : undefined,
    body: init?.json ? JSON.stringify(init.json) : init?.body,
    credentials: "same-origin",
    cache: "no-store",
  };
  const res = await fetch(path, opts);
  const payload = (await res.json().catch(() => ({}))) as {
    status?: string;
    data?: T;
    message?: string;
  };
  if (!res.ok || payload.status !== "success") {
    throw new Error(payload.message || `İstek başarısız (${res.status})`);
  }
  return payload.data as T;
}

export const api = {
  // auth
  me: () => call<{ user: UserPublic | null }>("/api/auth/me"),
  login: (username: string, password: string) =>
    call<{ user: UserPublic }>("/api/auth/login", {
      json: { username, password },
    }),
  logout: () => call<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  // users
  users: () => call<UserPublic[]>("/api/users"),
  createUser: (username: string, password: string, role: UserRole) =>
    call<UserPublic>("/api/users", { json: { username, password, role } }),

  // connections
  connections: () => call<ConnectionPublic[]>("/api/connections"),
  createConnection: (input: ConnectionInput) =>
    call<ConnectionPublic>("/api/connections", { json: input }),
  deleteConnection: (id: string) =>
    call<{ ok: boolean }>(`/api/connections/${id}`, { method: "DELETE" }),
  schema: (id: string, schema?: string, force?: boolean) =>
    call<{ schema: string; tables: TableMeta[] }>(
      `/api/connections/${id}/schema?${new URLSearchParams({
        ...(schema ? { schema } : {}),
        ...(force ? { force: "1" } : {}),
      })}`,
    ),

  // query
  runQuery: (query: ReportQuery, page: PageRequest) =>
    call<QueryResult>("/api/query", { json: { query, page } }),

  // reports
  reports: () =>
    call<
      Array<{
        id: string;
        name: string;
        ownerName: string;
        permission: string;
        updatedAt: string;
        table: string;
      }>
    >("/api/reports"),
  getReport: (id: string) =>
    call<SavedReport & { permission: string; shares: Array<{ userId: string; username: string; permission: SharePermission }> }>(
      `/api/reports/${id}`,
    ),
  createReport: (name: string, query: ReportQuery) =>
    call<SavedReport>("/api/reports", { json: { name, query } }),
  updateReport: (id: string, name: string, query: ReportQuery) =>
    call<SavedReport>(`/api/reports/${id}`, { method: "PUT", json: { name, query } }),
  deleteReport: (id: string) =>
    call<{ ok: boolean }>(`/api/reports/${id}`, { method: "DELETE" }),
  share: (id: string, username: string, permission: SharePermission | "remove") =>
    call<{ shares: Array<{ userId: string; username: string; permission: SharePermission }> }>(
      `/api/reports/${id}/share`,
      { json: { username, permission } },
    ),
};

export type { ColumnMeta };
