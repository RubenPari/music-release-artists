import type Artist from '#models/artist'
import type { ArtistDTO } from '#types/api'

/**
 * ArtistTransformer - Transforms Artist model to DTO
 *
 * @description Provides type-safe transformation of Artist model
 * with support for pagination and single item serialization.
 */
export class ArtistTransformer {
  /**
   * Transform a single artist
   */
  static toObject(artist: Artist): ArtistDTO {
    return {
      id: artist.id,
      spotifyArtistId: artist.spotifyArtistId,
      name: artist.name,
      imageUrl: artist.imageUrl,
      genres: this.parseGenres(artist.genres),
      followers: artist.followers,
      lastSyncedAt: artist.lastSyncedAt?.toISO() ?? null,
    }
  }

  /**
   * Parse genres from JSON string
   */
  private static parseGenres(genres: string | null): string[] | null {
    if (!genres) return null
    try {
      return JSON.parse(genres)
    } catch {
      return null
    }
  }

  /**
   * Transform multiple artists
   */
  static transform(artists: Artist[]): ArtistDTO[] {
    return artists.map((artist) => this.toObject(artist))
  }

  /**
   * Transform with pagination metadata
   */
  static paginate(
    artists: Artist[],
    meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  ): { data: ArtistDTO[]; meta: typeof meta } {
    return {
      data: this.transform(artists),
      meta,
    }
  }
}

export default ArtistTransformer
