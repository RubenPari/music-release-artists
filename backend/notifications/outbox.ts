import { exec, query, queryOne } from "../db/db";
import { config } from "../lib/config";
import { sendDigestEmail, sendPerReleaseEmail } from "./email";
import type { ReleaseEmailItem } from "./email";

const ARTISTS_SUBQUERY = `COALESCE(
  (SELECT string_agg(a.name, ', ' ORDER BY a.name)
   FROM release_artists ra JOIN artists a ON a.id = ra.artist_id
   WHERE ra.release_id = r.id),
  ''
)`;

interface ReleaseEmailRow {
  title: string;
  release_type: string;
  release_date: string;
  spotify_url: string;
  artists: string;
}

function toReleaseEmailItem(row: ReleaseEmailRow): ReleaseEmailItem {
  return {
    title: row.title,
    artists: row.artists,
    releaseType: row.release_type,
    releaseDate: row.release_date,
    spotifyUrl: row.spotify_url,
  };
}

export async function enqueuePerReleaseNotifications(
  userId: string,
): Promise<void> {
  if (!config.emailEnabled()) return;

  const prefs = await queryOne<{
    enabled: boolean;
    mode: string;
    email: string | null;
  }>(
    `SELECT enabled, mode, email FROM notification_preferences WHERE user_id = $1`,
    [userId],
  );
  if (!prefs?.enabled || prefs.mode !== "per_release" || !prefs.email) {
    return;
  }

  await exec(
    `INSERT INTO email_outbox (user_id, release_id, kind, status)
     SELECT $1, ur.release_id, 'per_release', 'pending'
     FROM user_releases ur
     WHERE ur.user_id = $1 AND ur.notified_at IS NULL
     ON CONFLICT DO NOTHING`,
    [userId],
  );

  await processPerReleaseOutbox(userId);
}

export async function processPerReleaseOutbox(userId?: string): Promise<void> {
  if (!config.emailEnabled()) return;

  const rows = await query<
    ReleaseEmailRow & { id: string; user_id: string; release_id: string; email: string }
  >(
    `SELECT o.id, o.user_id, o.release_id, np.email,
            r.title, r.release_type, r.release_date::text, r.spotify_url,
            ${ARTISTS_SUBQUERY} AS artists
     FROM email_outbox o
     JOIN notification_preferences np ON np.user_id = o.user_id
     JOIN releases r ON r.id = o.release_id
     WHERE o.status = 'pending' AND o.kind = 'per_release'
       AND np.enabled = TRUE AND np.mode = 'per_release'
       AND np.email IS NOT NULL AND np.email <> ''
       ${userId ? "AND o.user_id = $1" : ""}
     ORDER BY o.created_at ASC
     LIMIT 50`,
    userId ? [userId] : [],
  );

  for (const row of rows) {
    try {
      await sendPerReleaseEmail(row.user_id, row.email, toReleaseEmailItem(row));
      await exec(
        `UPDATE email_outbox SET status = 'sent', sent_at = NOW() WHERE id = $1`,
        [row.id],
      );
      await exec(
        `UPDATE user_releases SET notified_at = NOW()
         WHERE user_id = $1 AND release_id = $2 AND notified_at IS NULL`,
        [row.user_id, row.release_id],
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await exec(
        `UPDATE email_outbox SET status = 'failed', error_message = $2 WHERE id = $1`,
        [row.id, message.slice(0, 2000)],
      );
    }
  }
}

export async function sendDailyDigests(): Promise<void> {
  if (!config.emailEnabled()) return;

  const users = await query<{
    user_id: string;
    email: string;
  }>(
    `SELECT user_id, email FROM notification_preferences
     WHERE enabled = TRUE AND mode = 'digest'
       AND email IS NOT NULL AND email <> ''`,
  );

  for (const user of users) {
    const items = await query<ReleaseEmailRow & { release_id: string }>(
      `SELECT ur.release_id, r.title, r.release_type, r.release_date::text, r.spotify_url,
              ${ARTISTS_SUBQUERY} AS artists
       FROM user_releases ur
       JOIN releases r ON r.id = ur.release_id
       WHERE ur.user_id = $1 AND ur.notified_at IS NULL
       ORDER BY r.release_date DESC`,
      [user.user_id],
    );

    if (items.length === 0) continue;

    try {
      await sendDigestEmail(user.user_id, user.email, items.map(toReleaseEmailItem));

      await exec(
        `INSERT INTO email_outbox (user_id, release_id, kind, status, sent_at)
         VALUES ($1, NULL, 'digest', 'sent', NOW())`,
        [user.user_id],
      );

      await exec(
        `UPDATE user_releases SET notified_at = NOW()
         WHERE user_id = $1 AND notified_at IS NULL`,
        [user.user_id],
      );
    } catch (err) {
      console.error(`digest failed for ${user.user_id}`, err);
      await exec(
        `INSERT INTO email_outbox (user_id, release_id, kind, status, error_message)
         VALUES ($1, NULL, 'digest', 'failed', $2)`,
        [
          user.user_id,
          (err instanceof Error ? err.message : String(err)).slice(0, 2000),
        ],
      );
    }
  }
}
