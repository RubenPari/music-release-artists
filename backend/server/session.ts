import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { exec, queryOne } from "../db/db";
import { config } from "../lib/config";
import { hashToken, randomToken } from "../lib/crypto";

export interface SessionUser {
  userID: string;
  email: string | null;
  displayName: string;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32);
  const expires = new Date(
    Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000,
  );
  await exec(
    `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expires.toISOString()],
  );
  return token;
}

export async function resolveSession(
  token: string,
): Promise<SessionUser | null> {
  const row = await queryOne<{
    user_id: string;
    email: string | null;
    display_name: string;
    expires_at: Date;
  }>(
    `SELECT s.user_id, s.expires_at, u.email, u.display_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1`,
    [hashToken(token)],
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await exec(`DELETE FROM sessions WHERE token_hash = $1`, [
      hashToken(token),
    ]);
    return null;
  }
  return {
    userID: row.user_id,
    email: row.email,
    displayName: row.display_name,
  };
}

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, config.sessionCookieName, token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: config.sessionTtlDays * 24 * 60 * 60,
    secure: config.appBaseUrl().startsWith("https"),
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, config.sessionCookieName, { path: "/" });
}

export async function requireUser(c: Context): Promise<SessionUser> {
  const auth = c.req.header("Authorization");
  let token: string | undefined;
  if (auth?.startsWith("Bearer ")) {
    token = auth.slice(7).trim();
  } else {
    token = getCookie(c, config.sessionCookieName);
  }
  if (!token) {
    throw new AuthError("non autenticato");
  }
  const user = await resolveSession(token);
  if (!user) throw new AuthError("sessione non valida");
  return user;
}

export class AuthError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
  }
}
