/**
 * Services barrel export
 *
 * @module app/services
 */
export { ArtistService, artistService } from './artist_service.js'
export { default as SpotifyService } from './spotify_service.js'
export { LiveReleaseService, liveReleaseService } from './live_release_service.js'
// MailService is not exported as default, import directly if needed
