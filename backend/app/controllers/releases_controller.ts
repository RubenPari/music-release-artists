import type { HttpContext } from '@adonisjs/core/http'
import { releaseService } from '#services/release_service'
import SpotifyService from '#services/spotify_service'
import ReleaseTransformer from '#transformers/release_transformer'
import { releaseIndexValidator, releaseLatestValidator } from '#validators/release'

/**
 * ReleasesController - Thin controller for release endpoints
 *
 * @description Handles HTTP concerns only. Business logic is delegated to ReleaseService.
 * Each method follows the Rule of 30 (max 30 lines).
 */
export default class ReleasesController {
  /**
   * GET /api/v1/releases - List releases with filters
   */
  async index({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(releaseIndexValidator)

    const { releases, meta } = await releaseService.getReleasesForUser(user.id, {
      page: payload.page,
      limit: payload.limit,
      type: payload.type,
      artistId: payload.artist_id,
      sort: payload.sort,
      q: payload.q,
      fromDate: payload.from_date,
      toDate: payload.to_date,
    })

    return serialize(ReleaseTransformer.paginate(releases, meta))
  }

  /**
   * GET /api/v1/releases/latest - Get latest releases
   */
  async latest({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(releaseLatestValidator)

    const releases = await releaseService.getLatestReleases(user.id, payload.days ?? 30)

    return serialize(ReleaseTransformer.transform(releases))
  }

  /**
   * POST /api/v1/releases/sync - Sync releases from Spotify
   */
  async sync({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const result = await releaseService.syncReleasesFromSpotify(user, SpotifyService)

    return serialize({
      message: `Synced releases for ${result.artistsCount} artists (${result.releasesCount} releases)`,
    })
  }
}
