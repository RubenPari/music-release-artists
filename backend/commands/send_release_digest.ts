import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/ace'
import User from '#models/user'
import Release from '#models/release'
import NotificationLog from '#models/notification_log'
import Mail from '@adonisjs/mail/services/main'
import encryption from '@adonisjs/core/services/encryption'
import env from '#start/env'

interface ReleaseWithArtist {
  id: number
  title: string
  type: string
  coverUrl: string | null
  releaseDate: string
  spotifyUrl: string
  artist: {
    name: string
    imageUrl: string | null
  }
}

export default class SendReleaseDigestCommand extends BaseCommand {
  static commandName = 'send:release_digest'
  static description = 'Send release digest emails to users with notifications enabled'

  static options = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting release digest email job...')

    const users = await User.query()
      .where('notifications_enabled', true)
      .whereNotNull('spotifyId')

    if (users.length === 0) {
      this.logger.info('No users with notifications enabled. Exiting.')
      return
    }

    let totalSent = 0
    let totalSkipped = 0
    let totalErrors = 0

    for (const user of users) {
      try {
        const shouldSend = await this.shouldSendDigest(user)
        if (!shouldSend) {
          totalSkipped++
          continue
        }

        const releases = await this.getNewReleases(user)
        if (releases.length === 0) {
          totalSkipped++
          continue
        }

        const unsubscribeToken = encryption.encrypt({
          userId: user.id,
          purpose: 'unsubscribe'
        })

        await this.sendEmail(user, releases, unsubscribeToken)
        await this.logNotification(user, releases.length, 'sent')

        totalSent++
        this.logger.success(`Sent digest to ${user.email} (${releases.length} releases)`)
      } catch (error) {
        totalErrors++
        this.logger.error(`Failed to send digest to ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        
        try {
          await this.logNotification(user, 0, 'failed', error instanceof Error ? error.message : 'Unknown error')
        } catch (logError) {
          this.logger.error(`Failed to log notification: ${logError}`)
        }
      }
    }

    this.logger.info(`\nDigest job completed!`)
    this.logger.info(`Emails sent: ${totalSent}`)
    this.logger.info(`Skipped (no new releases or rate limited): ${totalSkipped}`)
    if (totalErrors > 0) {
      this.logger.info(`Errors: ${totalErrors}`)
    }
  }

  private async shouldSendDigest(user: User): Promise<boolean> {
    const frequency = user.notificationFrequency ?? 'daily'
    const lastNotification = await NotificationLog.query()
      .where('user_id', user.id)
      .where('status', 'sent')
      .orderBy('sent_at', 'desc')
      .first()

    if (!lastNotification) {
      return true
    }

    const hoursSinceLastNotification = DateTime.now().diff(lastNotification.sentAt, 'hours').hours

    if (frequency === 'daily') {
      return hoursSinceLastNotification >= 24
    } else if (frequency === 'weekly') {
      return hoursSinceLastNotification >= 168
    }

    return false
  }

  private async getNewReleases(user: User): Promise<ReleaseWithArtist[]> {
    const lastNotification = await NotificationLog.query()
      .where('user_id', user.id)
      .where('status', 'sent')
      .orderBy('sent_at', 'desc')
      .first()

    const sinceDate = lastNotification
      ? DateTime.fromJSDate(lastNotification.sentAt.toJSDate()).minus({ days: 1 }).toFormat('yyyy-MM-dd')
      : DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd')

    const userArtistIds = await user
      .related('artists')
      .query()
      .select('artists.id')
      .pojo<{ id: number }>()

    const artistIds = userArtistIds.map(a => a.id)
    if (artistIds.length === 0) {
      return []
    }

    const notificationTypes = user.notificationTypes
      ? JSON.parse(user.notificationTypes) as string[]
      : ['album', 'single', 'ep', 'compilation']

    const releases = await Release.query()
      .whereIn('artist_id', artistIds)
      .where('release_date', '>=', sinceDate)
      .whereIn('type', notificationTypes)
      .preload('artist')
      .orderBy('release_date', 'desc')

    return releases.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      coverUrl: r.coverUrl,
      releaseDate: r.releaseDate,
      spotifyUrl: r.spotifyUrl,
      artist: {
        name: r.artist.name,
        imageUrl: r.artist.imageUrl,
      }
    }))
  }

  private async sendEmail(user: User, releases: ReleaseWithArtist[], unsubscribeToken: string): Promise<void> {
    const displayName = user.fullName || user.displayName || user.email.split('@')[0]
    const appUrl = env.get('APP_URL', 'http://localhost:5173')

    const unsubscribeUrl = `${appUrl}/api/v1/notifications/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    const dashboardUrl = appUrl

    await Mail.send((message) => {
      message
        .from(env.get('MAIL_FROM', 'noreply@musicreleaseartists.com'))
        .to(user.email)
        .subject(`Nuove uscite musicali per ${displayName}`)
        .html(this.generateEmailHtml(displayName, releases, dashboardUrl, unsubscribeUrl))
    })
  }

  private generateEmailHtml(displayName: string, releases: ReleaseWithArtist[], dashboardUrl: string, unsubscribeUrl: string): string {
    const releasesList = releases.slice(0, 20).map(release => `
      <div style="display: flex; margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
        ${release.coverUrl 
          ? `<img src="${release.coverUrl}" alt="${release.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />`
          : `<div style="width: 80px; height: 80px; background: #ddd; border-radius: 4px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #999;">No Cover</div>`
        }
        <div>
          <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${release.title}</h3>
          <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">${release.artist.name}</p>
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="background: #aa3bff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">${release.type}</span>
            <span style="color: #999; font-size: 12px;">${release.releaseDate}</span>
          </div>
          <a href="${release.spotifyUrl}" style="display: inline-block; margin-top: 8px; color: #1DB954; text-decoration: none; font-size: 14px;">Ascolta su Spotify →</a>
        </div>
      </div>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f3ec; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #aa3bff 0%, #6b21a8 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nuove Uscite Musicali</h1>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333;">Ciao ${displayName}! 👋</h2>
            <p style="color: #666; margin: 0 0 20px 0;">Ecco le nuove uscite musicali dei tuoi artisti preferiti:</p>
            
            ${releasesList}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${dashboardUrl}" style="display: inline-block; background: #aa3bff; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Vai alla Dashboard →</a>
            </div>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">
              Ricevi questa email perché hai attivato le notifiche per le nuove uscite.
            </p>
            <a href="${unsubscribeUrl}" style="color: #999; font-size: 12px; text-decoration: underline;">
              Disiscriviti dalle notifiche
            </a>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private async logNotification(user: User, releasesCount: number, status: 'sent' | 'failed', errorMessage?: string): Promise<void> {
    await NotificationLog.create({
      userId: user.id,
      sentAt: DateTime.now(),
      releasesCount,
      status,
      errorMessage: errorMessage ?? null,
    })
  }
}
