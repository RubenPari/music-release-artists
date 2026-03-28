import type { HttpContext } from '@adonisjs/core/http'
import encryption from '@adonisjs/core/services/encryption'
import { DateTime } from 'luxon'
import User from '#models/user'
import SpotifyService from '#services/spotify_service'

export default class SpotifyAuthController {
  async redirect({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const state = encryption.encrypt(user.id)
    const url = SpotifyService.getAuthorizationUrl(state)

    return serialize({ url })
  }

  async callback({ request, response }: HttpContext) {
    const error = request.input('error')
    if (error) {
      return response.redirect(`http://localhost:5173/settings?spotify_error=${error}`)
    }

    const code = request.input('code')
    const state = request.input('state')

    if (!code || !state) {
      return response.redirect('http://localhost:5173/settings?spotify_error=missing_params')
    }

    const userId = encryption.decrypt<number>(state)
    if (!userId) {
      return response.redirect('http://localhost:5173/settings?spotify_error=invalid_state')
    }

    const user = await User.find(userId)
    if (!user) {
      return response.redirect('http://localhost:5173/settings?spotify_error=user_not_found')
    }

    const tokens = await SpotifyService.exchangeCode(code)
    const profile = await SpotifyService.getProfile(tokens.access_token)

    user.spotifyId = profile.id
    user.displayName = profile.display_name
    user.avatarUrl = profile.images?.[0]?.url ?? null
    user.country = profile.country
    user.accessTokenEnc = encryption.encrypt(tokens.access_token)
    user.refreshTokenEnc = encryption.encrypt(tokens.refresh_token!)
    user.tokenExpiresAt = DateTime.now().plus({ seconds: tokens.expires_in })
    await user.save()

    return response.redirect('http://localhost:5173/callback?spotify=connected')
  }

  async disconnect({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    user.spotifyId = null
    user.displayName = null
    user.avatarUrl = null
    user.accessTokenEnc = null
    user.refreshTokenEnc = null
    user.tokenExpiresAt = null
    user.country = null
    await user.save()

    return { message: 'Spotify account disconnected' }
  }
}
