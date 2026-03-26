import { ArtistSchema } from '#database/schema'
import { manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Release from '#models/release'

export default class Artist extends ArtistSchema {
  static table = 'artists'

  @manyToMany(() => User, {
    pivotTable: 'user_artists',
    pivotTimestamps: false,
    pivotColumns: ['followed_at'],
  })
  declare users: ManyToMany<typeof User>

  @hasMany(() => Release)
  declare releases: HasMany<typeof Release>
}
