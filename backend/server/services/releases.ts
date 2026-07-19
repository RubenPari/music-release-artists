import { query } from "../../db/db";
import { config } from "../../lib/config";

const ALLOWED = new Set(["album", "single", "ep"]);

export function parseReleaseTypesParam(types?: string): string[] | null {
  if (!types) return null;
  const filtered = types
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => ALLOWED.has(t));
  return filtered.length ? filtered : null;
}

export async function loadReleases(
  userId: string,
  params: { types?: string; from?: string; to?: string },
): Promise<
  Array<{
    id: string;
    title: string;
    releaseType: "album" | "single" | "ep";
    releaseDate: string;
    artworkUrl: string | null;
    spotifyUrl: string;
    artists: Array<{ id: string; name: string }>;
  }>
> {
  const windowDays = config.releaseWindowDays();
  const types = parseReleaseTypesParam(params.types);

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
