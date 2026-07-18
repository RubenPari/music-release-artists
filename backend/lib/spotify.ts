import { config, spotifyRedirectUri } from "./config";
import { decrypt, encrypt } from "./crypto";
import { exec, queryOne } from "../db/db";

const SPOTIFY_AUTH = "https://accounts.spotify.com";
const SPOTIFY_API = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = ["user-follow-read", "user-read-email"].join(" ");

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.spotifyClientId(),
    response_type: "code",
    redirect_uri: spotifyRedirectUri(),
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: "false",
  });
  return `${SPOTIFY_AUTH}/authorize?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

async function exchangeToken(body: URLSearchParams): Promise<TokenResponse> {
  const basic = Buffer.from(
    `${config.spotifyClientId()}:${config.spotifyClientSecret()}`,
  ).toString("base64");
  const res = await fetch(`${SPOTIFY_AUTH}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token error ${res.status}: ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  return exchangeToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: spotifyRedirectUri(),
    }),
  );
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return exchangeToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}

export async function saveTokens(
  userId: string,
  tokens: TokenResponse,
  existingRefresh?: string,
): Promise<void> {
  const refresh = tokens.refresh_token || existingRefresh;
  if (!refresh) {
    throw new Error("Missing refresh token from Spotify");
  }
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await exec(
    `INSERT INTO spotify_tokens (user_id, access_token_enc, refresh_token_enc, expires_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       access_token_enc = EXCLUDED.access_token_enc,
       refresh_token_enc = EXCLUDED.refresh_token_enc,
       expires_at = EXCLUDED.expires_at,
       updated_at = NOW()`,
    [userId, encrypt(tokens.access_token), encrypt(refresh), expiresAt.toISOString()],
  );
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const row = await queryOne<{
    access_token_enc: string;
    refresh_token_enc: string;
    expires_at: Date;
  }>(
    `SELECT access_token_enc, refresh_token_enc, expires_at
     FROM spotify_tokens WHERE user_id = $1`,
    [userId],
  );
  if (!row) {
    throw new Error("SPOTIFY_REAUTH_REQUIRED");
  }

  if (new Date(row.expires_at).getTime() > Date.now() + 60_000) {
    return decrypt(row.access_token_enc);
  }

  const refreshToken = decrypt(row.refresh_token_enc);
  try {
    const tokens = await refreshAccessToken(refreshToken);
    await saveTokens(userId, tokens, refreshToken);
    return tokens.access_token;
  } catch {
    throw new Error("SPOTIFY_REAUTH_REQUIRED");
  }
}

async function spotifyFetch<T>(
  userId: string,
  path: string,
  init?: RequestInit,
  attempt = 0,
): Promise<T> {
  const accessToken = await getValidAccessToken(userId);
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  if (res.status === 429 && attempt < 5) {
    const retryAfter = Number(res.headers.get("Retry-After") || "1");
    await sleep(Math.max(retryAfter, 1) * 1000 * (attempt + 1));
    return spotifyFetch(userId, path, init, attempt + 1);
  }

  if (res.status >= 500 && attempt < 3) {
    await sleep(500 * (attempt + 1));
    return spotifyFetch(userId, path, init, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify API ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email?: string;
  images?: { url: string }[];
}

export async function fetchCurrentUser(accessToken: string): Promise<SpotifyUser> {
  const res = await fetch(`${SPOTIFY_API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Spotify profile: ${res.status}`);
  }
  return (await res.json()) as SpotifyUser;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: { url: string }[];
}

export async function fetchFollowedArtists(
  userId: string,
): Promise<SpotifyArtist[]> {
  const artists: SpotifyArtist[] = [];
  let after: string | undefined;
  for (;;) {
    const qs = new URLSearchParams({ type: "artist", limit: "50" });
    if (after) qs.set("after", after);
    const data = await spotifyFetch<{
      artists: {
        items: SpotifyArtist[];
        cursors?: { after?: string };
        next: string | null;
      };
    }>(userId, `/me/following?${qs}`);
    artists.push(...data.artists.items);
    if (!data.artists.next || !data.artists.cursors?.after) break;
    after = data.artists.cursors.after;
    await sleep(150);
  }
  return artists;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  album_group?: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  images?: { url: string }[];
  external_urls?: { spotify?: string };
  artists: { id: string; name: string }[];
}

export async function fetchArtistAlbums(
  userId: string,
  artistId: string,
): Promise<SpotifyAlbum[]> {
  const albums: SpotifyAlbum[] = [];
  let offset = 0;
  for (;;) {
    const qs = new URLSearchParams({
      include_groups: "album,single",
      limit: "50",
      offset: String(offset),
    });
    const data = await spotifyFetch<{
      items: SpotifyAlbum[];
      next: string | null;
      total: number;
    }>(userId, `/artists/${artistId}/albums?${qs}`);
    albums.push(...data.items);
    if (!data.next) break;
    offset += data.items.length;
    await sleep(200);
  }
  return albums;
}

export type ReleaseType = "album" | "single" | "ep";

export function classifyReleaseType(
  albumType: string,
  totalTracks: number,
): ReleaseType {
  if (albumType === "album") return "album";
  if (totalTracks >= 3 && totalTracks <= 6) return "ep";
  return "single";
}

export function parseReleaseDate(date: string, precision: string): string {
  if (precision === "year") return `${date}-01-01`;
  if (precision === "month") return `${date}-01`;
  return date;
}
