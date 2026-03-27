import { DateTime } from 'luxon'
import Artist from '#models/artist'
import User from '#models/user'
import type SpotifyService from '#services/spotify_service'
import { PAGINATION_DEFAULTS } from '#utils/constants'

/**
 * ArtistService - Business logic for artist operations
 *
 * @description Handles all artist-related business logic including
 * fetching artists and syncing followed artists from Spotify.
 */
export class ArtistService {
  /**
   * Get paginated list of artists for a user
   */
  async getArtistsForUser(
    userId: number,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    artists: Artist[]
    meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  }> {
    const page = options.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE
    const limit = options.limit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT

    const user = await User.findOrFail(userId)
    const paginatedArtists = await user
      .related('artists')
      .query()
      .orderBy('name', 'asc')
      .paginate(page, limit)

    return {
      artists: paginatedArtists.all(),
      meta: paginatedArtists.getMeta(),
    }
  }

  /**
   * Sync followed artists from Spotify
   */
  async syncArtistsFromSpotify(
    user: User,
    spotifyServiceInstance: typeof SpotifyService
  ): Promise<{ syncedCount: number; artistIds: number[] }> {
    const accessToken = await spotifyServiceInstance.getValidAccessToken(user)
    const spotifyArtists = await spotifyServiceInstance.getFollowedArtists(accessToken)

    const artistIds = await this.processSpotifyArtists(user, spotifyArtists)

    return {
      syncedCount: artistIds.length,
      artistIds,
    }
  }

  /**
   * Process Spotify artists and sync with local database
   */
  private async processSpotifyArtists(
    user: User,
    spotifyArtists: Array<{
      id: string
      name: string
      images?: Array<{ url: string }>
      genres: string[]
      followers: { total: number }
    }>
  ): Promise<number[]> {
    const artistIds: number[] = []

    for (const sa of spotifyArtists) {
      const artist = await Artist.updateOrCreate(
        { spotifyArtistId: sa.id },
        {
          name: sa.name,
          imageUrl: sa.images?.[0]?.url ?? null,
          genres: JSON.stringify(sa.genres),
          followers: sa.followers.total,
          lastSyncedAt: DateTime.now(),
        }
      )
      artistIds.push(artist.id)
    }

    await this.syncUserArtists(user, artistIds)

    return artistIds
  }

  /**
   * Sync user's followed artists (attach new, detach unfollowed)
   */
  private async syncUserArtists(user: User, artistIds: number[]): Promise<void> {
    const pivotData = artistIds.reduce(
      (acc, id) => {
        acc[id] = { followed_at: DateTime.now().toSQL()! }
        return acc
      },
      {} as Record<number, { followed_at: string }>
    )

    await user.related('artists').sync(pivotData)
  }
}

/**
 * Singleton instance for dependency injection
 */
export const artistService = new ArtistService()
