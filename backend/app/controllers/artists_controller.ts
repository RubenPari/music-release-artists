import type { HttpContext } from '@adonisjs/core/http'
import { artistService } from '#services/artist_service'
import SpotifyService from '#services/spotify_service'
import ArtistTransformer from '#transformers/artist_transformer'

/**
 * ArtistsController - Thin controller for artist endpoints
 *
 * @description Handles HTTP concerns only. Business logic is delegated to ArtistService.
 * Each method follows the Rule of 30 (max 30 lines).
 */
export default class ArtistsController {
  /**
   * GET /api/v1/artists - List user's followed artists
   */
  async index({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const { artists, meta } = await artistService.getArtistsForUser(user.id, {
      page,
      limit,
    })

    return serialize(ArtistTransformer.paginate(artists, meta))
  }

  /**
   * POST /api/v1/artists/sync - Sync artists from Spotify
   */
  async sync({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const result = await artistService.syncArtistsFromSpotify(user, SpotifyService)

    return serialize({
      message: `Synced ${result.syncedCount} artists`,
    })
  }
}
