import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { manyToMany, hasMany, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import Artist from '#models/artist'
import NotificationLog from '#models/notification_log'

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 2

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column()
  declare emailVerificationToken: string | null

  @column.dateTime()
  declare emailSentAt: DateTime | null

  @column()
  declare passwordResetToken: string | null

  @column.dateTime()
  declare passwordResetSentAt: DateTime | null

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
    return `${first!.slice(0, 2)}`.toUpperCase()
  }

  get isSpotifyConnected(): boolean {
    return this.spotifyId !== null
  }

  get hasVerifiedEmail(): boolean {
    return this.emailVerifiedAt !== null
  }

  generateVerificationToken(): string {
    const token = randomBytes(32).toString('hex')
    this.emailVerificationToken = token
    this.emailSentAt = DateTime.now()
    return token
  }

  generatePasswordResetToken(): string {
    const token = randomBytes(32).toString('hex')
    this.passwordResetToken = token
    this.passwordResetSentAt = DateTime.now()
    return token
  }

  isVerificationTokenExpired(): boolean {
    if (!this.emailSentAt) {
      return true
    }
    const expiryTime = this.emailSentAt.plus({ hours: VERIFICATION_TOKEN_EXPIRY_HOURS })
    return DateTime.now() > expiryTime
  }

  isPasswordResetTokenExpired(): boolean {
    if (!this.passwordResetSentAt) {
      return true
    }
    const expiryTime = this.passwordResetSentAt.plus({ hours: PASSWORD_RESET_TOKEN_EXPIRY_HOURS })
    return DateTime.now() > expiryTime
  }

  async markAsVerified(): Promise<{ token: string }> {
    this.emailVerifiedAt = DateTime.now()
    this.emailVerificationToken = null
    await this.save()

    const token = await User.accessTokens.create(this)
    if (!token.value) throw new Error('Token generation failed')
    return { token: token.value.release() }
  }

  static async verifyEmail(token: string): Promise<User> {
    const user = await this.findByOrFail('emailVerificationToken', token)

    if (user.isVerificationTokenExpired()) {
      throw new Error('Verification token has expired')
    }

    if (user.hasVerifiedEmail) {
      throw new Error('Email already verified')
    }

    return user
  }

  static async verifyPasswordResetToken(token: string): Promise<User> {
    const user = await this.findByOrFail('passwordResetToken', token)

    if (user.isPasswordResetTokenExpired()) {
      throw new Error('Password reset token has expired')
    }

    return user
  }
}
