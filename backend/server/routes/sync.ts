import { queryOne } from "../../db/db";
import { syncUserFull } from "../../sync/engine";
import { AuthError } from "../session";
import type { AppHono } from "../types";

export function registerSyncRoutes(app: AppHono): void {
  app.post("/sync/refresh", async (c) => {
    const auth = c.get("user");
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
    const auth = c.get("user");
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
}
