import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/ace'
import User from '#models/user'
import Release from '#models/release'
import SpotifyService from '#services/spotify_service'

export default class SyncReleasesCommand extends BaseCommand {
  static commandName = 'sync:releases'
  static description = 'Sync releases from Spotify for all users'

  static options = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting release sync for all users...')

    const users = await User.query().whereNotNull('spotifyId')

    if (users.length === 0) {
      this.logger.info('No users with Spotify connected. Exiting.')
      return
    }

    let totalUsersSynced = 0
    let totalArtistsSynced = 0
    let totalReleasesSynced = 0
    let errors = 0

    for (const user of users) {
      try {
        const accessToken = await SpotifyService.getValidAccessToken(user)

        const artists = await user.related('artists').query()

        if (artists.length === 0) {
          this.logger.info(`User ${user.id}: No followed artists to sync`)
          continue
        }

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
              totalReleasesSynced++
            }
          }

          artist.lastSyncedAt = DateTime.now()
          await artist.save()
          totalArtistsSynced++
        }

        totalUsersSynced++
        this.logger.success(`User ${user.id}: Synced ${artists.length} artists`)
      } catch (error) {
        errors++
        this.logger.error(
          `User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    this.logger.info(`\nSync completed!`)
    this.logger.info(`Users synced: ${totalUsersSynced}`)
    this.logger.info(`Artists synced: ${totalArtistsSynced}`)
    this.logger.info(`New releases added: ${totalReleasesSynced}`)
    if (errors > 0) {
      this.logger.info(`Errors: ${errors}`)
    }
  }
}
