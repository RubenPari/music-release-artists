import { ArtistSchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Artist extends ArtistSchema {
  static table = 'artists'

  @manyToMany(() => User, {
    pivotTable: 'user_artists',
    pivotTimestamps: false,
    pivotColumns: ['followed_at'],
  })
  declare users: ManyToMany<typeof User>
}
