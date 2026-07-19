import { getCookie, setCookie } from "hono/cookie";
import { exec, queryOne } from "../../db/db";
import { config } from "../../lib/config";
import { randomToken } from "../../lib/crypto";
import {
  authorizeUrl,
  exchangeCode,
  fetchCurrentUser,
  saveTokens,
} from "../../lib/spotify";
import { syncUserFull } from "../../sync/engine";
import {
  AuthError,
  clearSessionCookie,
  createSession,
  requireUser,
  setSessionCookie,
} from "../session";
import type { AppHono } from "../types";

export function registerAuthRoutes(app: AppHono): void {
  app.get("/auth/spotify", async (c) => {
    const state = randomToken(16);
    setCookie(c, "mra_oauth_state", state, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 600,
      secure: config.appBaseUrl().startsWith("https"),
    });
    return c.redirect(authorizeUrl(state));
  });

  app.get("/auth/spotify/callback", async (c) => {
    try {
      const code = c.req.query("code");
      const state = c.req.query("state");
      const expectedState = getCookie(c, "mra_oauth_state");
      if (!code || !state || !expectedState || state !== expectedState) {
        return c.redirect(`${config.frontendOrigin()}/login?error=oauth`);
      }

      const tokens = await exchangeCode(code);
      const profile = await fetchCurrentUser(tokens.access_token);
      const avatar = profile.images?.[0]?.url ?? null;

      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM users WHERE spotify_user_id = $1`,
        [profile.id],
      );

      let userId: string;
      if (existing) {
        userId = existing.id;
        await exec(
          `UPDATE users SET display_name = $2, email = COALESCE($3, email), avatar_url = $4, updated_at = NOW()
           WHERE id = $1`,
          [userId, profile.display_name || "", profile.email ?? null, avatar],
        );
      } else {
        const created = await queryOne<{ id: string }>(
          `INSERT INTO users (spotify_user_id, display_name, email, avatar_url)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [
            profile.id,
            profile.display_name || "",
            profile.email ?? null,
            avatar,
          ],
        );
        userId = created!.id;
        await exec(
          `INSERT INTO notification_preferences (user_id, enabled, mode, email)
           VALUES ($1, FALSE, 'per_release', $2)`,
          [userId, profile.email ?? null],
        );
      }

      await saveTokens(userId, tokens);
      const sessionToken = await createSession(userId);
      setSessionCookie(c, sessionToken);

      void syncUserFull(userId).catch((err) =>
        console.error("initial sync failed", err),
      );

      return c.redirect(`${config.frontendOrigin()}/`);
    } catch (err) {
      console.error("oauth callback error", err);
      return c.redirect(`${config.frontendOrigin()}/login?error=oauth`);
    }
  });

  app.post("/auth/logout", async (c) => {
    const user = await requireUser(c).catch(() => null);
    void user;
    const token = getCookie(c, config.sessionCookieName);
    if (token) {
      const { hashToken } = await import("../../lib/crypto");
      await exec(`DELETE FROM sessions WHERE token_hash = $1`, [
        hashToken(token),
      ]);
    }
    clearSessionCookie(c);
    return c.json({ ok: true });
  });

  app.get("/auth/me", async (c) => {
    const auth = await requireUser(c);
    const user = await queryOne<{
      id: string;
      display_name: string;
      email: string | null;
      avatar_url: string | null;
    }>(
      `SELECT id, display_name, email, avatar_url FROM users WHERE id = $1`,
      [auth.userID],
    );
    if (!user) throw new AuthError("utente non trovato");
    return c.json({
      id: user.id,
      displayName: user.display_name,
      email: user.email,
      avatarUrl: user.avatar_url,
    });
  });
}
