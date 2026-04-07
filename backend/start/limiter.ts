import limiter from '@adonisjs/limiter/services/main'
import { RATE_LIMITS } from '#utils/constants'

export const spotifySyncLimiter = limiter.define('spotify_sync', (ctx) => {
  if (!ctx.auth.user) return limiter.noLimit()

  return limiter
    .allowRequests(RATE_LIMITS.SPOTIFY_SYNC.requests)
    .every(RATE_LIMITS.SPOTIFY_SYNC.period)
    .usingKey(ctx.auth.user.id)
})

export const authLimiter = limiter.define('auth', (ctx) => {
  return limiter
    .allowRequests(RATE_LIMITS.AUTH.requests)
    .every(RATE_LIMITS.AUTH.period)
    .usingKey(ctx.request.ip())
})

export const forgotPasswordLimiter = limiter.define('forgot_password', (ctx) => {
  return limiter
    .allowRequests(RATE_LIMITS.FORGOT_PASSWORD.requests)
    .every(RATE_LIMITS.FORGOT_PASSWORD.period)
    .usingKey(ctx.request.ip())
})

export const resendVerificationLimiter = limiter.define('resend_verification', (ctx) => {
  return limiter
    .allowRequests(RATE_LIMITS.RESEND_VERIFICATION.requests)
    .every(RATE_LIMITS.RESEND_VERIFICATION.period)
    .usingKey(ctx.request.ip())
})
