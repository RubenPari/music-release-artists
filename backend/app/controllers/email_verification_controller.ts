import User from '#models/user'
import { mailService } from '#services/mail_service'
import type { HttpContext } from '@adonisjs/core/http'
import Env from '#start/env'
import { resendVerificationEmailValidator } from '#validators/resend_verification_email'

export default class EmailVerificationController {
  async verify({ params, response }: HttpContext) {
    const { token } = params

    try {
      const user = await User.verifyEmail(token)
      const { token: accessToken } = await user.markAsVerified()

      const appUrl = Env.get('APP_URL', 'http://localhost:5173')
      return response.redirect(`${appUrl}/callback?verified=true&token=${accessToken}`)
    } catch (error) {
      const appUrl = Env.get('APP_URL', 'http://localhost:5173')
      const message = error instanceof Error ? error.message : 'Verification failed'
      return response.redirect(`${appUrl}/callback?verify_error=${encodeURIComponent(message)}`)
    }
  }

  async resend({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.hasVerifiedEmail) {
      return response.status(400).json({
        message: 'Email already verified',
      })
    }

    const token = user.generateVerificationToken()
    await user.save()
    await mailService.sendVerificationEmail(user, token)

    return {
      message: 'Verification email sent',
      email: user.email,
    }
  }

  async resendPublic({ request, response, logger }: HttpContext) {
    const { email } = await request.validateUsing(resendVerificationEmailValidator)

    const genericResponse = {
      message: "Se esiste un account con questa email, ti abbiamo inviato una nuova email di verifica.",
    }

    const user = await User.findBy('email', email)
    if (!user) {
      return response.status(200).json(genericResponse)
    }

    if (user.hasVerifiedEmail) {
      return response.status(200).json(genericResponse)
    }

    const token = user.generateVerificationToken()
    await user.save()

    try {
      await mailService.sendVerificationEmail(user, token)
    } catch (error) {
      logger.error({ err: error }, 'Failed to resend verification email')
    }

    return response.status(200).json(genericResponse)
  }
}
