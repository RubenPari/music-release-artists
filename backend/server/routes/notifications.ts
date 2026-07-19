import { exec } from "../../db/db";
import { verifyUnsubscribe } from "../../lib/crypto";
import type { AppHono } from "../types";

export function registerNotificationsRoutes(app: AppHono): void {
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
}
