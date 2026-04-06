import { DateTime } from 'luxon'
import Artist from '#models/artist'
import User from '#models/user'
import type SpotifyService from '#services/spotify_service'
import { PAGINATION_DEFAULTS, type RELEASE_TYPES, SORT_OPTIONS } from '#utils/constants'

export interface LiveReleaseArtistDTO {
  id: number
  spotifyArtistId: string
  name: string
  imageUrl: string | null
}

export interface LiveReleaseDTO {
  id: string
  spotifyReleaseId: string
  title: string
  type: (typeof RELEASE_TYPES)[number]
  coverUrl: string | null
  releaseDate: string
  spotifyUrl: string
  artist: LiveReleaseArtistDTO
}

export interface LiveReleasesPage {
  data: LiveReleaseDTO[]
  meta: { total: number; perPage: number; currentPage: number; lastPage: number }
}

type SpotifyAlbum = {
  id: string
  name: string
  album_type: string
  artists: Array<{ id: string; name: string }>
  images?: Array<{ url: string }>
  release_date: string
  external_urls: { spotify: string }
}

function normalizeType(albumType: string): (typeof RELEASE_TYPES)[number] | null {
  if (albumType === 'album' || albumType === 'single' || albumType === 'compilation') return albumType
  return null
}

function withinDateRange(releaseDate: string, fromDate?: string, toDate?: string): boolean {
  if (fromDate && releaseDate < fromDate) return false
  if (toDate && releaseDate > toDate) return false
  return true
}

export class LiveReleaseService {
  async getLiveReleasesForUser(
    userId: number,
    spotifyServiceInstance: typeof SpotifyService,
    filters: {
      page?: number
      limit?: number
      type?: (typeof RELEASE_TYPES)[number]
      artistId?: number
      sort?: (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS]
      q?: string
      fromDate?: string
      toDate?: string
    }
  ): Promise<LiveReleasesPage> {
    const page = filters.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE
    const limit = filters.limit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT

    const user = await User.findOrFail(userId)
    const accessToken = await spotifyServiceInstance.getValidAccessToken(user)
    const artists = await user.related('artists').query()

    if (artists.length === 0) {
      return { data: [], meta: { total: 0, perPage: limit, currentPage: page, lastPage: 1 } }
    }

    const bySpotifyArtistId = new Map<string, Artist>()
    for (const artist of artists) bySpotifyArtistId.set(artist.spotifyArtistId, artist)

    const releases = await this.fetchAllAlbums(accessToken, artists, user.country ?? undefined, spotifyServiceInstance)

    const filtered = releases
      .filter((r) => (filters.type ? r.type === filters.type : true))
      .filter((r) => (filters.artistId ? r.artist.id === filters.artistId : true))
      .filter((r) => (filters.q ? this.matchesQuery(r, filters.q) : true))
      .filter((r) => withinDateRange(r.releaseDate, filters.fromDate, filters.toDate))

    const sortDir = filters.sort === SORT_OPTIONS.RELEASE_DATE_ASC ? 'asc' : 'desc'
    filtered.sort((a, b) => {
      if (a.releaseDate === b.releaseDate) return a.title.localeCompare(b.title)
      return sortDir === 'asc' ? a.releaseDate.localeCompare(b.releaseDate) : b.releaseDate.localeCompare(a.releaseDate)
    })

    const total = filtered.length
    const lastPage = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(Math.max(1, page), lastPage)
    const start = (safePage - 1) * limit
    const end = start + limit

    return {
      data: filtered.slice(start, end),
      meta: { total, perPage: limit, currentPage: safePage, lastPage },
    }
  }

  async getLiveReleasesSince(
    user: User,
    spotifyServiceInstance: typeof SpotifyService,
    sinceDate: string,
    types: Array<(typeof RELEASE_TYPES)[number]>
  ): Promise<LiveReleaseDTO[]> {
    const accessToken = await spotifyServiceInstance.getValidAccessToken(user)
    const artists = await user.related('artists').query()
    if (artists.length === 0) return []

    const releases = await this.fetchAllAlbums(accessToken, artists, user.country ?? undefined, spotifyServiceInstance)

    return releases
      .filter((r) => r.releaseDate >= sinceDate)
      .filter((r) => types.includes(r.type))
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  }

  private async fetchAllAlbums(
    accessToken: string,
    artists: Artist[],
    market: string | undefined,
    spotifyServiceInstance: typeof SpotifyService
  ): Promise<LiveReleaseDTO[]> {
    const bySpotifyArtistId = new Map<string, Artist>()
    for (const artist of artists) bySpotifyArtistId.set(artist.spotifyArtistId, artist)

    const seen = new Set<string>()
    const releases: LiveReleaseDTO[] = []

    for (const artist of artists) {
      const albums = await spotifyServiceInstance.getArtistAlbums(accessToken, artist.spotifyArtistId, market)

      for (const album of albums as SpotifyAlbum[]) {
        if (seen.has(album.id)) continue
        seen.add(album.id)

        const type = normalizeType(album.album_type)
        if (!type) continue

        const resolvedArtist = this.resolveArtist(bySpotifyArtistId, artist, album.artists)

        releases.push({
          id: album.id,
          spotifyReleaseId: album.id,
          title: album.name,
          type,
          coverUrl: album.images?.[0]?.url ?? null,
          releaseDate: album.release_date,
          spotifyUrl: album.external_urls.spotify,
          artist: {
            id: resolvedArtist.id,
            spotifyArtistId: resolvedArtist.spotifyArtistId,
            name: resolvedArtist.name,
            imageUrl: resolvedArtist.imageUrl,
          },
        })
      }

      artist.lastSyncedAt = DateTime.now()
      await artist.save()
    }

    return releases
  }

  private resolveArtist(
    bySpotifyArtistId: Map<string, Artist>,
    fallback: Artist,
    albumArtists?: Array<{ id: string; name: string }>
  ): Artist {
    const primarySpotifyId = albumArtists?.[0]?.id
    if (!primarySpotifyId) return fallback
    return bySpotifyArtistId.get(primarySpotifyId) ?? fallback
  }

  private matchesQuery(release: LiveReleaseDTO, q: string): boolean {
    const query = q.trim().toLowerCase()
    if (!query) return true
    return (
      release.title.toLowerCase().includes(query) ||
      release.artist.name.toLowerCase().includes(query)
    )
  }
}

export const liveReleaseService = new LiveReleaseService()

