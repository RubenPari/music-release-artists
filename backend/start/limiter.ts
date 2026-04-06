import limiter from '@adonisjs/limiter/services/main'

export const spotifySyncLimiter = limiter.define('spotify_sync', (ctx) => {
  if (!ctx.auth.user) return limiter.noLimit()

  return limiter.allowRequests(5).every('1 minute').usingKey(ctx.auth.user.id)
})

export const authLimiter = limiter.define('auth', (ctx) => {
  return limiter.allowRequests(10).every('1 minute').usingKey(ctx.request.ip())
})

export const forgotPasswordLimiter = limiter.define('forgot_password', (ctx) => {
  return limiter.allowRequests(3).every('5 minutes').usingKey(ctx.request.ip())
})

export const resendVerificationLimiter = limiter.define('resend_verification', (ctx) => {
  return limiter.allowRequests(3).every('5 minutes').usingKey(ctx.request.ip())
})
