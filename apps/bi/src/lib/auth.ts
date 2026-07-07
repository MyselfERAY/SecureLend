import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { findUserById } from "./store";
import { authSecret } from "./env";
import type { User, UserPublic } from "./types";

const COOKIE = "bi_session";
const ALG = "HS256";

function secret(): Uint8Array {
  // Production'da zayıf/placeholder secret ise env.authSecret() fırlatır (fail-hard).
  return new TextEncoder().encode(authSecret());
}

export interface SessionClaims {
  sub: string; // user id
  username: string;
  role: User["role"];
}

export async function createSession(user: User): Promise<string> {
  return new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Resolve the current authenticated user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    if (!payload.sub) return null;
    return await findUserById(payload.sub);
  } catch {
    return null;
  }
}

export function toPublic(user: User): UserPublic {
  return { id: user.id, username: user.username, role: user.role };
}

/** Throwable guard for route handlers. */
export class AuthError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Oturum gerekli");
  return user;
}
