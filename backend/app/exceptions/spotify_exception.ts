import { Exception } from '@adonisjs/core/exceptions'

export class SpotifyAuthException extends Exception {
  static noTokens() {
    return new this('User has no Spotify tokens', { status: 400, code: 'E_SPOTIFY_NO_TOKENS' })
  }

  static decryptionFailed(field: string) {
    return new this(`Failed to decrypt ${field}`, { status: 500, code: 'E_SPOTIFY_DECRYPT_FAILED' })
  }

  static apiError(status: number, body: string) {
    return new this(`Spotify API error ${status}: ${body}`, { status: 502, code: 'E_SPOTIFY_API_ERROR' })
  }

  static maxRetriesExceeded() {
    return new this('Spotify API: max retries exceeded', { status: 502, code: 'E_SPOTIFY_MAX_RETRIES' })
  }
}
