import { test } from '@japa/runner'
import SpotifyService from '#services/spotify_service'

test.group('SpotifyService', () => {
  test('should generate authorization URL', ({ assert }) => {
    const url = SpotifyService.getAuthorizationUrl('test')

    assert.isTrue(url.includes('https://accounts.spotify.com/authorize'))
    assert.isTrue(url.includes('client_id='))
    assert.isTrue(url.includes('response_type=code'))
    assert.isTrue(url.includes('redirect_uri='))
    assert.isTrue(url.includes('scope='))
  })

  test('should include required scopes in authorization URL', ({ assert }) => {
    const url = SpotifyService.getAuthorizationUrl('test')

    assert.isTrue(url.includes('user-read-private'))
    assert.isTrue(url.includes('user-read-email'))
    assert.isTrue(url.includes('user-follow-read'))
  })

  test('should use correct API base URLs', ({ assert }) => {
    assert.equal(SpotifyService.API_BASE, 'https://api.spotify.com/v1')
    assert.equal(SpotifyService.ACCOUNTS_BASE, 'https://accounts.spotify.com')
  })
})
