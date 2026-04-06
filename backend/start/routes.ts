/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import {
  spotifySyncLimiter,
  authLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
} from '#start/limiter'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/health', () => {
  return { status: 'ok' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessToken, 'store']).use(authLimiter)
        router.post('logout', [controllers.AccessToken, 'destroy']).use(middleware.auth())
        router.post('forgot-password', [controllers.PasswordReset, 'forgot']).use(forgotPasswordLimiter)
        router.get('reset-password/:token', [controllers.PasswordReset, 'redirect'])
        router.post('reset-password', [controllers.PasswordReset, 'reset']).use(authLimiter)
        router.get('verify-email/:token', [controllers.EmailVerification, 'verify'])
        router.post('verify-email/resend', [controllers.EmailVerification, 'resendPublic']).use(resendVerificationLimiter)
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('/redirect', [controllers.SpotifyAuth, 'redirect']).use(middleware.auth())
        router.get('/callback', [controllers.SpotifyAuth, 'callback'])
        router.post('/disconnect', [controllers.SpotifyAuth, 'disconnect']).use(middleware.auth())
      })
      .prefix('spotify')
      .as('spotify')

    router
      .group(() => {
        router.get('/notifications', [controllers.NotificationSettings, 'show'])
        router.patch('/notifications', [controllers.NotificationSettings, 'update'])
      })
      .prefix('settings')
      .as('settings')
      .use(middleware.auth())

    router
      .group(() => {
        router.post('/unsubscribe', [controllers.NotificationSettings, 'unsubscribe'])
        router.get('/history', [controllers.NotificationHistory, 'index']).use(middleware.auth())
      })
      .prefix('notifications')
      .as('notifications')

    router
      .group(() => {
        router.get('/', [controllers.Artists, 'index'])
        router.post('/sync', [controllers.Artists, 'sync']).use(spotifySyncLimiter)
      })
      .prefix('artists')
      .as('artists')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('/live', [controllers.Releases, 'live'])
      })
      .prefix('releases')
      .as('releases')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
