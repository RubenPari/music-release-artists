import type Release from '#models/release'
import { ArtistTransformer } from '#transformers/artist_transformer'
import type { ReleaseDTO } from '#types/api'

/**
 * ReleaseTransformer - Transforms Release model to DTO
 *
 * @description Provides type-safe transformation of Release model
 * with support for pagination and single item serialization.
 */
export class ReleaseTransformer {
  /**
   * Transform a single release
   */
  static toObject(release: Release): ReleaseDTO {
    return {
      id: release.id,
      spotifyReleaseId: release.spotifyReleaseId,
      title: release.title,
      type: release.type as ReleaseDTO['type'],
      coverUrl: release.coverUrl,
      releaseDate: release.releaseDate,
      spotifyUrl: release.spotifyUrl,
      firstSeenAt: release.firstSeenAt.toISO()!,
      artist: release.artist
        ? ArtistTransformer.toObject(release.artist)
        : {} as ReleaseDTO['artist'],
    }
  }

  /**
   * Transform multiple releases
   */
  static transform(releases: Release[]): ReleaseDTO[] {
    return releases.map((release) => this.toObject(release))
  }

  /**
   * Transform with pagination metadata
   */
  static paginate(
    releases: Release[],
    meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  ): { data: ReleaseDTO[]; meta: typeof meta } {
    return {
      data: this.transform(releases),
      meta,
    }
  }
}

export default ReleaseTransformer
