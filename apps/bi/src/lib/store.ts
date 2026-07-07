import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { hashPassword, newId } from "./crypto";
import type { Connection, SavedReport, User } from "./types";

// ---------------------------------------------------------------------------
// Tiny JSON-file metadata store. Deliberately dependency-free (no SQLite/native
// add-on) so the app boots anywhere. Designed behind a narrow async API so it
// can later be swapped for Prisma/Postgres without touching callers.
//
// Writes are serialized through an in-process promise chain and committed
// atomically (write temp file, then rename).
// ---------------------------------------------------------------------------

interface DbShape {
  users: User[];
  connections: Connection[];
  reports: SavedReport[];
}

const EMPTY: DbShape = { users: [], connections: [], reports: [] };

function dataDir(): string {
  return process.env.BI_DATA_DIR
    ? path.resolve(process.env.BI_DATA_DIR)
    : path.join(process.cwd(), "data");
}
function dbPath(): string {
  return path.join(dataDir(), "db.json");
}

let cache: DbShape | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

async function load(): Promise<DbShape> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(dbPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    cache = {
      users: parsed.users ?? [],
      connections: parsed.connections ?? [],
      reports: parsed.reports ?? [],
    };
  } catch {
    cache = structuredClone(EMPTY);
  }
  return cache;
}

async function persist(db: DbShape): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${dbPath()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, dbPath());
}

/** Run a mutation under the serialized write lock. */
function mutate<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
  const next = writeChain.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  // keep the chain alive even if this mutation rejects
  writeChain = next.catch(() => undefined);
  return next;
}

// --- Bootstrap -------------------------------------------------------------

let bootstrapped = false;
export async function ensureBootstrap(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  await mutate((db) => {
    if (db.users.length > 0) return;
    const username = process.env.BI_BOOTSTRAP_ADMIN_USER || "admin";
    const isProd = process.env.NODE_ENV === "production";
    let password = process.env.BI_BOOTSTRAP_ADMIN_PASSWORD;
    if (!password) {
      if (isProd) {
        // Production'da sabit "admin1234" varsayılanı KULLANMA — rastgele üret
        // ve tek seferlik logla (operatör bunu okuyup hemen değiştirmeli).
        password = randomBytes(12).toString("base64url");
        // eslint-disable-next-line no-console
        console.warn(
          `[BI] BOOTSTRAP ADMIN parolası üretildi (tek seferlik, HEMEN değiştirin): ${password}`,
        );
      } else {
        password = "admin1234"; // yalnızca geliştirme
      }
    }
    db.users.push({
      id: newId("usr"),
      username,
      role: "admin",
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    });
  });
}

// --- Users -----------------------------------------------------------------

export async function listUsers(): Promise<User[]> {
  return [...(await load()).users];
}
export async function findUserByName(username: string): Promise<User | null> {
  const db = await load();
  return (
    db.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    ) ?? null
  );
}
export async function findUserById(id: string): Promise<User | null> {
  const db = await load();
  return db.users.find((u) => u.id === id) ?? null;
}
export async function createUser(
  username: string,
  password: string,
  role: User["role"] = "user",
): Promise<User> {
  return mutate((db) => {
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Kullanıcı adı zaten mevcut");
    }
    const user: User = {
      id: newId("usr"),
      username,
      role,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  });
}

// --- Connections -----------------------------------------------------------

export async function listConnections(): Promise<Connection[]> {
  return [...(await load()).connections];
}
export async function getConnection(id: string): Promise<Connection | null> {
  const db = await load();
  return db.connections.find((c) => c.id === id) ?? null;
}
export async function saveConnection(conn: Connection): Promise<Connection> {
  return mutate((db) => {
    const idx = db.connections.findIndex((c) => c.id === conn.id);
    if (idx >= 0) db.connections[idx] = conn;
    else db.connections.push(conn);
    return conn;
  });
}
export async function deleteConnection(id: string): Promise<void> {
  await mutate((db) => {
    db.connections = db.connections.filter((c) => c.id !== id);
  });
}

// --- Reports ---------------------------------------------------------------

export async function listReports(): Promise<SavedReport[]> {
  return [...(await load()).reports];
}
export async function getReport(id: string): Promise<SavedReport | null> {
  const db = await load();
  return db.reports.find((r) => r.id === id) ?? null;
}
export async function saveReport(report: SavedReport): Promise<SavedReport> {
  return mutate((db) => {
    const idx = db.reports.findIndex((r) => r.id === report.id);
    if (idx >= 0) db.reports[idx] = report;
    else db.reports.push(report);
    return report;
  });
}
export async function deleteReport(id: string): Promise<void> {
  await mutate((db) => {
    db.reports = db.reports.filter((r) => r.id !== id);
  });
}
