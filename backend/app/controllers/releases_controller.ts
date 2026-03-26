import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Release from '#models/release'
import SpotifyService from '#services/spotify_service'
import ReleaseTransformer from '#transformers/release_transformer'
import { releaseIndexValidator, releaseLatestValidator } from '#validators/release'

export default class ReleasesController {
  async index({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(releaseIndexValidator)

    const page = payload.page ?? 1
    const limit = payload.limit ?? 20

    // Get IDs of artists the user follows
    const userArtistIds = await user
      .related('artists')
      .query()
      .select('artists.id')
      .pojo<{ id: number }>()

    const artistIds = userArtistIds.map((a) => a.id)
    if (artistIds.length === 0) {
      return serialize({ data: [], meta: { total: 0, perPage: limit, currentPage: page, lastPage: 1 } })
    }

    const query = Release.query()
      .whereIn('artist_id', artistIds)
      .preload('artist')

    if (payload.type) {
      query.where('type', payload.type)
    }

    if (payload.artist_id) {
      query.where('artist_id', payload.artist_id)
    }

    if (payload.q) {
      query.where((q) => {
        q.whereILike('title', `%${payload.q}%`).orWhereHas('artist', (aq) => {
          aq.whereILike('name', `%${payload.q}%`)
        })
      })
    }

    const sortDir = payload.sort === 'release_date_asc' ? 'asc' : 'desc'
    query.orderBy('release_date', sortDir)

    const releases = await query.paginate(page, limit)

    return serialize(
      ReleaseTransformer.paginate(releases.all(), releases.getMeta())
    )
  }

  async latest({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(releaseLatestValidator)
    const days = payload.days ?? 30

    const userArtistIds = await user
      .related('artists')
      .query()
      .select('artists.id')
      .pojo<{ id: number }>()

    const artistIds = userArtistIds.map((a) => a.id)
    if (artistIds.length === 0) {
      return serialize([])
    }

    const since = DateTime.now().minus({ days }).toFormat('yyyy-MM-dd')

    const releases = await Release.query()
      .whereIn('artist_id', artistIds)
      .where('release_date', '>=', since)
      .preload('artist')
      .orderBy('release_date', 'desc')

    return serialize(ReleaseTransformer.transform(releases))
  }

  async sync({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const accessToken = await SpotifyService.getValidAccessToken(user)

    const artists = await user.related('artists').query()

    let totalSynced = 0

    for (const artist of artists) {
      const albums = await SpotifyService.getArtistAlbums(
        accessToken,
        artist.spotifyArtistId,
        user.country ?? undefined
      )

      for (const album of albums) {
        const existing = await Release.findBy('spotifyReleaseId', album.id)
        if (existing) {
          existing.merge({
            artistId: artist.id,
            title: album.name,
            type: album.album_type,
            coverUrl: album.images?.[0]?.url ?? null,
            releaseDate: album.release_date,
            spotifyUrl: album.external_urls.spotify,
          })
          await existing.save()
        } else {
          await Release.create({
            spotifyReleaseId: album.id,
            artistId: artist.id,
            title: album.name,
            type: album.album_type,
            coverUrl: album.images?.[0]?.url ?? null,
            releaseDate: album.release_date,
            spotifyUrl: album.external_urls.spotify,
            firstSeenAt: DateTime.now(),
          })
        }
        totalSynced++
      }
    }

    return serialize({
      message: `Synced releases for ${artists.length} artists (${totalSynced} releases)`,
    })
  }
}
