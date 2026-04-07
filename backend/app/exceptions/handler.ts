import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors } from '@adonisjs/core'
import { errors as vineErrors } from '@vinejs/vine'
import { SpotifyAuthException } from '#exceptions/spotify_exception'
import { EmailSendException } from '#exceptions/email_exception'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof errors.E_ROUTE_NOT_FOUND) {
      return ctx.response.status(404).json({
        message: 'Resource not found',
      })
    }

    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).json({
        message: 'Validation failed',
        errors: error.messages,
      })
    }

    if (error instanceof SpotifyAuthException) {
      return ctx.response.status(error.status).json({
        message: error.message,
        code: error.code,
      })
    }

    if (error instanceof EmailSendException) {
      return ctx.response.status(error.status).json({
        message: 'Unable to send email. Please try again later.',
        code: error.code,
      })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    if (app.inProduction) {
      ctx.logger.error({ err: error }, 'Unhandled error')
    }
    return super.report(error, ctx)
  }
}
