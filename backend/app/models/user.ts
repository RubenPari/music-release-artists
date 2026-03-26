import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import Artist from '#models/artist'
import NotificationLog from '#models/notification_log'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @manyToMany(() => Artist, {
    pivotTable: 'user_artists',
    pivotTimestamps: false,
    pivotColumns: ['followed_at'],
  })
  declare artists: ManyToMany<typeof Artist>

  @hasMany(() => NotificationLog)
  declare notificationLogs: HasMany<typeof NotificationLog>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  get isSpotifyConnected(): boolean {
    return this.spotifyId != null
  }
}
