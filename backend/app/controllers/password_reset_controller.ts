import User from '#models/user'
import { mailService } from '#services/mail_service'
import { forgotPasswordValidator } from '#validators/forgot_password'
import { resetPasswordValidator } from '#validators/reset_password'
import Env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

export default class PasswordResetController {
  async forgot({ request, response, logger }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)

    const genericResponse = {
      message: "Se esiste un account con questa email, ti abbiamo inviato un link per reimpostare la password.",
    }

    const user = await User.findBy('email', email)
    if (!user) {
      return response.status(200).json(genericResponse)
    }

    const token = user.generatePasswordResetToken()
    await user.save()

    try {
      await mailService.sendPasswordResetEmail(user, token)
    } catch (error) {
      logger.error({ err: error }, 'Failed to send password reset email')
    }

    return response.status(200).json(genericResponse)
  }

  async redirect({ params, response }: HttpContext) {
    const { token } = params

    const appUrl = Env.get('APP_URL', 'http://localhost:5173')

    try {
      await User.verifyPasswordResetToken(token)
      return response.redirect(`${appUrl}/reset-password?token=${encodeURIComponent(token)}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed'
      return response.redirect(`${appUrl}/login?error=${encodeURIComponent(message)}`)
    }
  }

  async reset({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const user = await User.verifyPasswordResetToken(token)

    user.password = password
    user.passwordResetToken = null
    user.passwordResetSentAt = null
    await user.save()

    return response.status(200).json({
      message: 'Password aggiornata con successo. Ora puoi accedere.',
    })
  }
}

