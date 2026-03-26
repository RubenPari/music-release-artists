import type Release from '#models/release'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ArtistTransformer from '#transformers/artist_transformer'

export default class ReleaseTransformer extends BaseTransformer<Release> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'spotifyReleaseId',
        'title',
        'type',
        'coverUrl',
        'releaseDate',
        'spotifyUrl',
        'firstSeenAt',
      ]),
      artist: ArtistTransformer.transform(this.whenLoaded(this.resource.artist)),
    }
  }
}
