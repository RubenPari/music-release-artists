import type { HttpContext } from '@adonisjs/core/http'
import SpotifyService from '#services/spotify_service'
import { liveReleaseService } from '#services/live_release_service'
import { releaseLiveIndexValidator } from '#validators/live_release'

/**
 * ReleasesController - Thin controller for release endpoints
 *
 * @description Handles HTTP concerns only. Business logic is delegated to LiveReleaseService.
 * Each method follows the Rule of 30 (max 30 lines).
 */
export default class ReleasesController {
  /**
   * GET /api/v1/releases/live - List releases (live) with filters
   */
  async live({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(releaseLiveIndexValidator)

    const result = await liveReleaseService.getLiveReleasesForUser(user.id, SpotifyService, {
      page: payload.page,
      limit: payload.limit,
      type: payload.type,
      artistId: payload.artist_id,
      sort: payload.sort,
      q: payload.q,
      fromDate: payload.from_date,
      toDate: payload.to_date,
    })

    return serialize(result)
  }
}
