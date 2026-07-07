import type { Connection, User } from "./types";

/**
 * Bir kullanıcı bir Oracle bağlantısına yalnızca sahibiyse veya admin ise
 * erişebilir. Bağlantılar global bir havuz DEĞİLDİR — aksi halde herhangi bir
 * oturumlu kullanıcı başkasının production Oracle DB'sini sorgulayabilir (IDOR).
 */
export function canAccessConnection(conn: Connection, user: User): boolean {
  return conn.ownerId === user.id || user.role === "admin";
}
