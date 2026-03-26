import limiter from '@adonisjs/limiter/services/main'

export const spotifySyncLimiter = limiter.define('spotify_sync', (ctx) => {
  if (!ctx.auth.user) return limiter.noLimit()

  return limiter
    .allowRequests(5)
    .every('1 minute')
    .usingKey(ctx.auth.user.id)
})
