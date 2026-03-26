import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Artist from '#models/artist'
import SpotifyService from '#services/spotify_service'
import ArtistTransformer from '#transformers/artist_transformer'

export default class ArtistsController {
  async index({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const artists = await user
      .related('artists')
      .query()
      .orderBy('name', 'asc')
      .paginate(page, limit)

    return serialize(
      ArtistTransformer.paginate(artists.all(), artists.getMeta())
    )
  }

  async sync({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const accessToken = await SpotifyService.getValidAccessToken(user)

    const spotifyArtists = await SpotifyService.getFollowedArtists(accessToken)

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

    // Sync pivot: attach new, detach unfollowed
    await user.related('artists').sync(
      artistIds.reduce(
        (acc, id) => {
          acc[id] = { followed_at: DateTime.now().toSQL()! }
          return acc
        },
        {} as Record<number, { followed_at: string }>
      )
    )

    const artists = await user.related('artists').query().orderBy('name', 'asc')

    return serialize({
      message: `Synced ${artists.length} artists`,
      artists: ArtistTransformer.transform(artists),
    })
  }
}
