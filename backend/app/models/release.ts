import { ReleaseSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Artist from '#models/artist'

export default class Release extends ReleaseSchema {
  static table = 'releases'

  @belongsTo(() => Artist)
  declare artist: BelongsTo<typeof Artist>
}
