/**
 * Services barrel export
 *
 * @module app/services
 */
export { ReleaseService, releaseService } from './release_service.js'
export { ArtistService, artistService } from './artist_service.js'
export { default as SpotifyService } from './spotify_service.js'
// MailService is not exported as default, import directly if needed
