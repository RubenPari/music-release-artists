import { exec, query, queryOne } from "../db/db";
import { config } from "../lib/config";
import { classifyReleaseType, parseReleaseDate } from "../lib/release-type";
import { fetchArtistAlbums, fetchFollowedArtists } from "../lib/spotify";
import { enqueuePerReleaseNotifications } from "../notifications/outbox";

const running = new Set<string>();

interface PreparedRelease {
  spotifyAlbumId: string;
  title: string;
  releaseType: string;
  releaseDate: string;
  artworkUrl: string | null;
  spotifyUrl: string;
  totalTracks: number;
}

export async function syncUserFull(userId: string): Promise<{
  artists: number;
  releases: number;
}> {
  if (running.has(userId)) {
    return { artists: 0, releases: 0 };
  }
  running.add(userId);

  const run = await queryOne<{ id: string }>(
    `INSERT INTO sync_runs (user_id, kind, status) VALUES ($1, 'full', 'running') RETURNING id`,
    [userId],
  );
  const runId = run!.id;

  try {
    const artistsCount = await syncFollowedArtists(userId);
    const releasesCount = await syncReleasesForUser(userId);
    await exec(
      `UPDATE sync_runs SET status = 'success', finished_at = NOW() WHERE id = $1`,
      [runId],
    );
    if (config.emailEnabled()) {
      await enqueuePerReleaseNotifications(userId);
    }
    return { artists: artistsCount, releases: releasesCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await exec(
      `UPDATE sync_runs SET status = 'error', error_message = $2, finished_at = NOW() WHERE id = $1`,
      [runId, message.slice(0, 2000)],
    );
    throw err;
  } finally {
    running.delete(userId);
  }
}

async function syncFollowedArtists(userId: string): Promise<number> {
  const followed = await fetchFollowedArtists(userId);

  // Dedupe by Spotify id: un upsert bulk non può toccare due volte la stessa riga.
  const unique = new Map<string, (typeof followed)[number]>();
  for (const artist of followed) unique.set(artist.id, artist);
  const artists = [...unique.values()];

  if (artists.length === 0) {
    await exec(`DELETE FROM user_artists WHERE user_id = $1`, [userId]);
    return 0;
  }

  const spotifyIds = artists.map((a) => a.id);
  const names = artists.map((a) => a.name);
  const images = artists.map((a) => a.images?.[0]?.url ?? null);

  const rows = await query<{ id: string }>(
    `INSERT INTO artists (spotify_artist_id, name, image_url, updated_at)
     SELECT sid, name, image, NOW()
     FROM unnest($1::text[], $2::text[], $3::text[]) AS t(sid, name, image)
     ON CONFLICT (spotify_artist_id) DO UPDATE SET
       name = EXCLUDED.name,
       image_url = COALESCE(EXCLUDED.image_url, artists.image_url),
       updated_at = NOW()
     RETURNING id`,
    [spotifyIds, names, images],
  );
  const artistIds = rows.map((r) => r.id);

  await exec(
    `INSERT INTO user_artists (user_id, artist_id, synced_at)
     SELECT $1, aid, NOW() FROM unnest($2::uuid[]) AS t(aid)
     ON CONFLICT (user_id, artist_id) DO UPDATE SET synced_at = NOW()`,
    [userId, artistIds],
  );

  await exec(
    `DELETE FROM user_artists
     WHERE user_id = $1 AND NOT (artist_id = ANY($2::uuid[]))`,
    [userId, artistIds],
  );

  return artists.length;
}

async function syncReleasesForUser(userId: string): Promise<number> {
  const windowDays = config.releaseWindowDays();
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const artists = await query<{ id: string; spotify_artist_id: string }>(
    `SELECT a.id, a.spotify_artist_id
     FROM user_artists ua
     JOIN artists a ON a.id = ua.artist_id
     WHERE ua.user_id = $1`,
    [userId],
  );

  let upserted = 0;

  for (const artist of artists) {
    const albums = await fetchArtistAlbums(userId, artist.spotify_artist_id);

    // Filtra la finestra temporale e dedupe per album id per il bulk upsert.
    const prepared = new Map<string, PreparedRelease>();
    for (const album of albums) {
      if (album.album_group === "appears_on") continue;
      const releaseDate = parseReleaseDate(
        album.release_date,
        album.release_date_precision,
      );
      if (releaseDate < cutoffStr) continue;
      prepared.set(album.id, {
        spotifyAlbumId: album.id,
        title: album.name,
        releaseType: classifyReleaseType(album.album_type, album.total_tracks),
        releaseDate,
        artworkUrl: album.images?.[0]?.url ?? null,
        spotifyUrl:
          album.external_urls?.spotify ||
          `https://open.spotify.com/album/${album.id}`,
        totalTracks: album.total_tracks,
      });
    }

    const items = [...prepared.values()];
    if (items.length === 0) continue;

    const rows = await query<{ id: string }>(
      `INSERT INTO releases (
         spotify_album_id, title, release_type, release_date,
         artwork_url, spotify_url, total_tracks, updated_at
       )
       SELECT sid, title, rtype, rdate::date, art, url, tracks, NOW()
       FROM unnest(
         $1::text[], $2::text[], $3::text[], $4::text[],
         $5::text[], $6::text[], $7::int[]
       ) AS t(sid, title, rtype, rdate, art, url, tracks)
       ON CONFLICT (spotify_album_id) DO UPDATE SET
         title = EXCLUDED.title,
         release_type = EXCLUDED.release_type,
         release_date = EXCLUDED.release_date,
         artwork_url = COALESCE(EXCLUDED.artwork_url, releases.artwork_url),
         spotify_url = EXCLUDED.spotify_url,
         total_tracks = EXCLUDED.total_tracks,
         updated_at = NOW()
       RETURNING id`,
      [
        items.map((i) => i.spotifyAlbumId),
        items.map((i) => i.title),
        items.map((i) => i.releaseType),
        items.map((i) => i.releaseDate),
        items.map((i) => i.artworkUrl),
        items.map((i) => i.spotifyUrl),
        items.map((i) => i.totalTracks),
      ],
    );
    const releaseIds = rows.map((r) => r.id);

    await exec(
      `INSERT INTO release_artists (release_id, artist_id)
       SELECT rid, $2 FROM unnest($1::uuid[]) AS t(rid)
       ON CONFLICT DO NOTHING`,
      [releaseIds, artist.id],
    );

    await exec(
      `INSERT INTO user_releases (user_id, release_id, detected_at)
       SELECT $1, rid, NOW() FROM unnest($2::uuid[]) AS t(rid)
       ON CONFLICT (user_id, release_id) DO NOTHING`,
      [userId, releaseIds],
    );

    upserted += items.length;
  }

  // Drop user_releases outside window (keep release rows shared)
  await exec(
    `DELETE FROM user_releases ur
     USING releases r
     WHERE ur.release_id = r.id
       AND ur.user_id = $1
       AND r.release_date < $2::date`,
    [userId, cutoffStr],
  );

  return upserted;
}

export async function syncAllUsers(): Promise<void> {
  const users = await query<{ id: string }>(
    `SELECT u.id FROM users u
     INNER JOIN spotify_tokens t ON t.user_id = u.id`,
  );
  for (const user of users) {
    try {
      await syncUserFull(user.id);
    } catch (err) {
      console.error(`sync failed for user ${user.id}`, err);
    }
  }
}
