import type Artist from '#models/artist'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ArtistTransformer extends BaseTransformer<Artist> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'spotifyArtistId',
      'name',
      'imageUrl',
      'genres',
      'followers',
      'lastSyncedAt',
    ])
  }
}
