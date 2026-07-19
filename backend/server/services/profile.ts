import { queryOne } from "../../db/db";
import { config } from "../../lib/config";
import { AuthError } from "../session";

export async function loadProfile(userId: string): Promise<{
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  emailEnabled: boolean;
  notificationsEnabled: boolean;
  notificationMode: "per_release" | "digest";
  notificationEmail: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  followedArtistsCount: number;
}> {
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
    emailEnabled: config.emailEnabled(),
    notificationsEnabled: config.emailEnabled() && row.enabled,
    notificationMode: row.mode,
    notificationEmail: row.pref_email,
    lastSyncAt: row.last_sync_at
      ? new Date(row.last_sync_at).toISOString()
      : null,
    lastSyncStatus: row.last_sync_status,
    followedArtistsCount: Number(row.artists_count),
  };
}
