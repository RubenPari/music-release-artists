import env from '#start/env'

interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

interface SpotifyProfile {
  id: string
  display_name: string | null
  email: string
  country: string
  images: Array<{ url: string; height: number | null; width: number | null }>
}

interface SpotifyArtist {
  id: string
  name: string
  images: Array<{ url: string; height: number | null; width: number | null }>
  genres: string[]
  followers: { total: number }
}

interface SpotifyArtistsResponse {
  artists: {
    items: SpotifyArtist[]
    next: string | null
    cursors: { after: string | null }
    total: number
  }
}

interface SpotifyAlbum {
  id: string
  name: string
  album_type: string
  images: Array<{ url: string; height: number | null; width: number | null }>
  release_date: string
  release_date_precision: string
  external_urls: { spotify: string }
}

interface SpotifyAlbumsResponse {
  items: SpotifyAlbum[]
  next: string | null
  total: number
}

export default class SpotifyService {
  static readonly API_BASE = 'https://api.spotify.com/v1'
  static readonly ACCOUNTS_BASE = 'https://accounts.spotify.com'

  static getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.get('SPOTIFY_CLIENT_ID'),
      response_type: 'code',
      redirect_uri: env.get('SPOTIFY_REDIRECT_URI'),
      scope: 'user-read-private user-read-email user-follow-read',
      state,
    })
    return `${this.ACCOUNTS_BASE}/authorize?${params}`
  }

  static async exchangeCode(code: string): Promise<SpotifyTokenResponse> {
    const response = await this.fetchWithRetry(`${this.ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.getBasicAuth()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.get('SPOTIFY_REDIRECT_URI'),
      }),
    })

    return response.json() as Promise<SpotifyTokenResponse>
  }

  static async getProfile(accessToken: string): Promise<SpotifyProfile> {
    const response = await this.fetchWithRetry(`${this.API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return response.json() as Promise<SpotifyProfile>
  }

  static async getFollowedArtists(accessToken: string, after?: string): Promise<SpotifyArtist[]> {
    const params = new URLSearchParams({ type: 'artist', limit: '50' })
    if (after) params.set('after', after)

    const response = await this.fetchWithRetry(`${this.API_BASE}/me/following?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = (await response.json()) as SpotifyArtistsResponse
    const artists = data.artists.items

    if (data.artists.cursors.after) {
      const more = await this.getFollowedArtists(accessToken, data.artists.cursors.after)
      artists.push(...more)
    }

    return artists
  }

  static async getArtistAlbums(
    accessToken: string,
    artistId: string,
    market?: string
  ): Promise<SpotifyAlbum[]> {
    const params = new URLSearchParams({
      include_groups: 'album,single,appears_on,compilation',
      limit: '50',
    })
    if (market) params.set('market', market)

    const response = await this.fetchWithRetry(
      `${this.API_BASE}/artists/${artistId}/albums?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    const data = (await response.json()) as SpotifyAlbumsResponse
    return data.items
  }

  static async refreshAccessToken(
    refreshToken: string
  ): Promise<{ access_token: string; expires_in: number }> {
    const response = await this.fetchWithRetry(`${this.ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.getBasicAuth()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    return response.json() as Promise<{ access_token: string; expires_in: number }>
  }

  private static getBasicAuth(): string {
    const clientId = env.get('SPOTIFY_CLIENT_ID')
    const clientSecret = env.get('SPOTIFY_CLIENT_SECRET')
    return Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  }

  private static async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3
  ): Promise<Response> {
    for (let attempt = 0; attempt < retries; attempt++) {
      const response = await fetch(url, options)

      if (response.ok) return response

      if (response.status === 429) {
        const retryAfter = Number.parseInt(response.headers.get('Retry-After') || '1', 10)
        await this.sleep(retryAfter * 1000)
        continue
      }

      if (response.status === 401 || attempt === retries - 1) {
        const body = await response.text()
        throw new Error(`Spotify API error ${response.status}: ${body}`)
      }

      await this.sleep(Math.pow(2, attempt) * 1000)
    }

    throw new Error('Spotify API: max retries exceeded')
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export type { SpotifyProfile, SpotifyArtist, SpotifyAlbum }
