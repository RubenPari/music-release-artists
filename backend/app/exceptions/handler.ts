import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors } from '@adonisjs/core'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof errors.E_ROUTE_NOT_FOUND) {
      return ctx.response.status(404).json({
        message: 'Resource not found',
      })
    }

    if (error instanceof errors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).json({
        message: 'Validation failed',
        errors: error.messages,
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
