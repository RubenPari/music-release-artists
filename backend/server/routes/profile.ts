import { exec, queryOne } from "../../db/db";
import { config } from "../../lib/config";
import { requireUser } from "../session";
import { loadProfile } from "../services/profile";
import type { AppHono } from "../types";

export function registerProfileRoutes(app: AppHono): void {
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

    const changesEmailPreferences =
      body.notificationsEnabled !== undefined ||
      body.notificationMode !== undefined ||
      body.notificationEmail !== undefined;
    if (!config.emailEnabled() && changesEmailPreferences) {
      return c.json(
        {
          message: "Le notifiche email non sono disponibili.",
          code: "email_disabled",
        },
        403,
      );
    }

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
}
