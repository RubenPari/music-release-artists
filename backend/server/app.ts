import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import { exec, query, queryOne } from "../db/db";
import { ensureMigrated } from "../db/migrate";
import { config } from "../lib/config";
import { randomToken, verifyUnsubscribe } from "../lib/crypto";
import {
  authorizeUrl,
  exchangeCode,
  fetchCurrentUser,
  saveTokens,
} from "../lib/spotify";
import { syncUserFull } from "../sync/engine";
import {
  AuthError,
  clearSessionCookie,
  createSession,
  requireUser,
  setSessionCookie,
} from "./session";

type Variables = {
  userId: string;
};

export function createApp() {
  const app = new Hono<{ Variables: Variables }>();

  app.use(
    "*",
    cors({
      origin: config.frontendOrigin(),
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    }),
  );

  app.use("*", async (_c, next) => {
    await ensureMigrated();
    await next();
  });

  app.onError((err, c) => {
    if (err instanceof AuthError) {
      return c.json({ message: err.message, code: "unauthenticated" }, 401);
    }
    console.error(err);
    return c.json(
      {
        message: err instanceof Error ? err.message : "errore interno",
        code: "internal",
      },
      500,
    );
  });

  app.get("/health", (c) => c.json({ ok: true }));

  // ---- Auth ----
  app.get("/auth/spotify", async (c) => {
    const state = randomToken(16);
    setCookie(c, "mra_oauth_state", state, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 600,
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
      const { hashToken } = await import("../lib/crypto");
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

  // ---- Sync ----
  app.post("/sync/refresh", async (c) => {
    const auth = await requireUser(c);
    try {
      const result = await syncUserFull(auth.userID);
      return c.json({ status: "ok", ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "SPOTIFY_REAUTH_REQUIRED") {
        throw new AuthError(
          "token Spotify scaduto, effettua di nuovo il login",
        );
      }
      throw err;
    }
  });

  app.get("/sync/status", async (c) => {
    const auth = await requireUser(c);
    const row = await queryOne<{
      finished_at: Date | null;
      status: string;
      error_message: string | null;
    }>(
      `SELECT finished_at, status, error_message
       FROM sync_runs
       WHERE user_id = $1 AND status != 'running'
       ORDER BY started_at DESC
       LIMIT 1`,
      [auth.userID],
    );
    return c.json({
      lastSyncAt: row?.finished_at
        ? new Date(row.finished_at).toISOString()
        : null,
      lastStatus: row?.status ?? null,
      lastError: row?.error_message ?? null,
    });
  });

  // ---- Feed ----
  app.get("/feed/releases", async (c) => {
    const auth = await requireUser(c);
    const releases = await loadReleases(auth.userID, {
      types: c.req.query("types"),
      from: c.req.query("from"),
      to: c.req.query("to"),
    });
    return c.json({ releases });
  });

  app.get("/feed/calendar", async (c) => {
    const auth = await requireUser(c);
    const releases = await loadReleases(auth.userID, {
      types: c.req.query("types"),
      from: c.req.query("from"),
      to: c.req.query("to"),
    });
    const map = new Map<string, typeof releases>();
    for (const rel of releases) {
      const list = map.get(rel.releaseDate) || [];
      list.push(rel);
      map.set(rel.releaseDate, list);
    }
    const days = [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, releases: items }));
    return c.json({ days });
  });

  // ---- Profile ----
  app.get("/profile", async (c) => {
    const auth = await requireUser(c);
    return c.json(await loadProfile(auth.userID));
  });

  app.put("/profile/preferences", async (c) => {
    const auth = await requireUser(c);
    const body = await c.req.json<{
      notificationsEnabled?: boolean;
      notificationMode?: "per_release" | "digest";
      notificationEmail?: string;
    }>();

    if (
      body.notificationMode &&
      body.notificationMode !== "per_release" &&
      body.notificationMode !== "digest"
    ) {
      return c.json({ message: "modalità non valida", code: "invalid" }, 400);
    }
    if (body.notificationEmail !== undefined) {
      const email = body.notificationEmail.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return c.json({ message: "email non valida", code: "invalid" }, 400);
      }
    }

    const current = await queryOne<{
      enabled: boolean;
      mode: string;
      email: string | null;
    }>(
      `SELECT enabled, mode, email FROM notification_preferences WHERE user_id = $1`,
      [auth.userID],
    );

    const enabled =
      body.notificationsEnabled !== undefined
        ? body.notificationsEnabled
        : (current?.enabled ?? false);
    const mode =
      body.notificationMode ??
      (current?.mode as "per_release" | "digest" | undefined) ??
      "per_release";
    const email =
      body.notificationEmail !== undefined
        ? body.notificationEmail.trim() || null
        : (current?.email ?? null);

    await exec(
      `INSERT INTO notification_preferences (user_id, enabled, mode, email, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         mode = EXCLUDED.mode,
         email = EXCLUDED.email,
         updated_at = NOW()`,
      [auth.userID, enabled, mode, email],
    );

    return c.json(await loadProfile(auth.userID));
  });

  // ---- Notifications ----
  app.get("/notifications/unsubscribe", async (c) => {
    const token = c.req.query("token") || "";
    const userId = verifyUnsubscribe(token);
    if (!userId) {
      return c.html("<p>Link non valido.</p>", 400);
    }
    await exec(
      `UPDATE notification_preferences SET enabled = FALSE, updated_at = NOW() WHERE user_id = $1`,
      [userId],
    );
    return c.html(
      "<p>Notifiche disattivate. Puoi riattivarle dal profilo nell'app.</p>",
    );
  });

  return app;
}

async function loadProfile(userId: string) {
  const row = await queryOne<{
    id: string;
    display_name: string;
    email: string | null;
    avatar_url: string | null;
    enabled: boolean;
    mode: "per_release" | "digest";
    pref_email: string | null;
    last_sync_at: Date | null;
    last_sync_status: string | null;
    artists_count: string;
  }>(
    `SELECT u.id, u.display_name, u.email, u.avatar_url,
            COALESCE(np.enabled, FALSE) AS enabled,
            COALESCE(np.mode, 'per_release') AS mode,
            np.email AS pref_email,
            sr.finished_at AS last_sync_at,
            sr.status AS last_sync_status,
            (SELECT COUNT(*)::text FROM user_artists ua WHERE ua.user_id = u.id) AS artists_count
     FROM users u
     LEFT JOIN notification_preferences np ON np.user_id = u.id
     LEFT JOIN LATERAL (
       SELECT finished_at, status FROM sync_runs
       WHERE user_id = u.id AND status != 'running'
       ORDER BY started_at DESC LIMIT 1
     ) sr ON TRUE
     WHERE u.id = $1`,
    [userId],
  );
  if (!row) throw new AuthError("profilo non trovato");
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    notificationsEnabled: row.enabled,
    notificationMode: row.mode,
    notificationEmail: row.pref_email,
    lastSyncAt: row.last_sync_at
      ? new Date(row.last_sync_at).toISOString()
      : null,
    lastSyncStatus: row.last_sync_status,
    followedArtistsCount: Number(row.artists_count),
  };
}

async function loadReleases(
  userId: string,
  params: { types?: string; from?: string; to?: string },
) {
  const windowDays = config.releaseWindowDays();
  const allowed = new Set(["album", "single", "ep"]);
  const types = params.types
    ? params.types
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => allowed.has(t))
    : null;

  const values: unknown[] = [userId, windowDays];
  let typeClause = "";
  if (types && types.length) {
    values.push(types);
    typeClause = `AND r.release_type = ANY($${values.length}::text[])`;
  }
  let fromClause = "";
  if (params.from) {
    values.push(params.from);
    fromClause = `AND r.release_date >= $${values.length}::date`;
  }
  let toClause = "";
  if (params.to) {
    values.push(params.to);
    toClause = `AND r.release_date <= $${values.length}::date`;
  }

  const rows = await query<{
    id: string;
    title: string;
    release_type: "album" | "single" | "ep";
    release_date: string;
    artwork_url: string | null;
    spotify_url: string;
    artist_ids: string[] | null;
    artist_names: string[] | null;
  }>(
    `SELECT r.id, r.title, r.release_type, r.release_date::text, r.artwork_url, r.spotify_url,
            array_agg(a.id ORDER BY a.name) FILTER (WHERE a.id IS NOT NULL) AS artist_ids,
            array_agg(a.name ORDER BY a.name) FILTER (WHERE a.id IS NOT NULL) AS artist_names
     FROM user_releases ur
     JOIN releases r ON r.id = ur.release_id
     LEFT JOIN release_artists ra ON ra.release_id = r.id
     LEFT JOIN artists a ON a.id = ra.artist_id
     WHERE ur.user_id = $1
       AND r.release_date >= (CURRENT_DATE - ($2::int || ' days')::interval)
       ${typeClause} ${fromClause} ${toClause}
     GROUP BY r.id
     ORDER BY r.release_date DESC, r.title ASC`,
    values,
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    releaseType: r.release_type,
    releaseDate: r.release_date,
    artworkUrl: r.artwork_url,
    spotifyUrl: r.spotify_url,
    artists: (r.artist_ids || []).map((id, i) => ({
      id,
      name: r.artist_names?.[i] || "",
    })),
  }));
}
