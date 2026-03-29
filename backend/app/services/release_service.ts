import { DateTime } from 'luxon'
import Release from '#models/release'
import Artist from '#models/artist'
import User from '#models/user'
import type SpotifyService from '#services/spotify_service'
import { PAGINATION_DEFAULTS, type RELEASE_TYPES, SORT_OPTIONS } from '#utils/constants'

/**
 * ReleaseService - Business logic for release operations
 *
 * @description Handles all release-related business logic including
 * fetching, syncing, and filtering releases from Spotify.
 */
export class ReleaseService {
  /**
   * Build query for fetching releases with filters
   */
  async getReleasesForUser(
    userId: number,
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
  ): Promise<{
    releases: Release[]
    meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  }> {
    const page = filters.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE
    const limit = filters.limit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT

    const artistIds = await this.getUserArtistIds(userId)
    if (artistIds.length === 0) {
      return {
        releases: [],
        meta: { total: 0, perPage: limit, currentPage: page, lastPage: 1 },
      }
    }

    const query = Release.query().whereIn('artist_id', artistIds).preload('artist')

    this.applyFilters(query, filters)
    this.applySorting(query, filters.sort)

    const paginatedResult = await query.paginate(page, limit)

    return {
      releases: paginatedResult.all(),
      meta: paginatedResult.getMeta(),
    }
  }

  /**
   * Get latest releases within a date range
   */
  async getLatestReleases(userId: number, days: number = 30): Promise<Release[]> {
    const artistIds = await this.getUserArtistIds(userId)
    if (artistIds.length === 0) {
      return []
    }

    const since = DateTime.now().minus({ days }).toFormat('yyyy-MM-dd')

    return Release.query()
      .whereIn('artist_id', artistIds)
      .where('release_date', '>=', since)
      .preload('artist')
      .orderBy('release_date', 'desc')
  }

  /**
   * Sync releases from Spotify for all user artists
   */
  async syncReleasesFromSpotify(
    user: User,
    spotifyServiceInstance: typeof SpotifyService
  ): Promise<{ artistsCount: number; releasesCount: number }> {
    const accessToken = await spotifyServiceInstance.getValidAccessToken(user)
    const artists = await user.related('artists').query()

    let totalSynced = 0

    for (const artist of artists) {
      const albums = await spotifyServiceInstance.getArtistAlbums(
        accessToken,
        artist.spotifyArtistId,
        user.country ?? undefined
      )

      await this.processAlbums(artist, albums)
      totalSynced += albums.length
    }

    return { artistsCount: artists.length, releasesCount: totalSynced }
  }

  /**
   * Get artist IDs for a user
   */
  private async getUserArtistIds(userId: number): Promise<number[]> {
    const user = await User.findOrFail(userId)
    const artists = await user
      .related('artists')
      .query()
      .select('artists.id')
      .pojo<{ id: number }>()

    return artists.map((a) => a.id)
  }

  /**
   * Apply filters to release query
   */
  private applyFilters(
    query: ModelQueryBuilderContract<typeof Release>,
    filters: {
      type?: (typeof RELEASE_TYPES)[number]
      artistId?: number
      q?: string
      fromDate?: string
      toDate?: string
    }
  ): void {
    if (filters.type) {
      query.where('type', filters.type)
    }

    if (filters.artistId) {
      query.where('artist_id', filters.artistId)
    }

    if (filters.q) {
      query.where((q) => {
        q.where('title', 'like', `%${filters.q}%`).orWhereHas('artist', (aq) => {
          aq.where('name', 'like', `%${filters.q}%`)
        })
      })
    }

    if (filters.fromDate) {
      query.where('release_date', '>=', filters.fromDate)
    }

    if (filters.toDate) {
      query.where('release_date', '<=', filters.toDate)
    }
  }

  /**
   * Apply sorting to release query
   */
  private applySorting(
    query: ModelQueryBuilderContract<typeof Release>,
    sort?: (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS]
  ): void {
    const sortDir = sort === SORT_OPTIONS.RELEASE_DATE_ASC ? 'asc' : 'desc'
    query.orderBy('release_date', sortDir)
  }

  /**
   * Process albums from Spotify and upsert releases.
   * Resolves the correct artist using the album's primary artist from Spotify.
   * Corrects artistId on existing releases if it doesn't match Spotify's primary artist.
   */
  private async processAlbums(
    artist: Artist,
    albums: Array<{
      id: string
      name: string
      album_type: string
      artists: Array<{ id: string; name: string }>
      images?: Array<{ url: string }>
      release_date: string
      external_urls: { spotify: string }
    }>
  ): Promise<void> {
    for (const album of albums) {
      const resolvedArtistId = await this.resolveArtistId(artist, album.artists)
      const existing = await Release.findBy('spotifyReleaseId', album.id)

      if (existing) {
        existing.title = album.name
        existing.type = album.album_type
        existing.coverUrl = album.images?.[0]?.url ?? null
        existing.releaseDate = album.release_date
        existing.spotifyUrl = album.external_urls.spotify
        existing.artistId = resolvedArtistId
        await existing.save()
      } else {
        await Release.create({
          spotifyReleaseId: album.id,
          artistId: resolvedArtistId,
          title: album.name,
          type: album.album_type,
          coverUrl: album.images?.[0]?.url ?? null,
          releaseDate: album.release_date,
          spotifyUrl: album.external_urls.spotify,
          firstSeenAt: DateTime.now(),
        })
      }
    }
  }

  /**
   * Resolve the correct artist ID for an album.
   * Uses the album's primary artist from Spotify if they exist in our DB,
   * otherwise falls back to the artist we're syncing for.
   */
  private async resolveArtistId(
    syncingArtist: Artist,
    albumArtists?: Array<{ id: string; name: string }>
  ): Promise<number> {
    const primarySpotifyId = albumArtists?.[0]?.id
    if (!primarySpotifyId || primarySpotifyId === syncingArtist.spotifyArtistId) {
      return syncingArtist.id
    }

    const primaryArtist = await Artist.findBy('spotifyArtistId', primarySpotifyId)
    return primaryArtist ? primaryArtist.id : syncingArtist.id
  }
}

/**
 * Singleton instance for dependency injection
 */
export const releaseService = new ReleaseService()
