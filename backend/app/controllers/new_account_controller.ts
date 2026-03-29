import User from '#models/user'
import { signupValidator } from '#validators/user'
import { mailService } from '#services/mail_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async store({ request, response, logger }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({ fullName, email, password })
    const token = user.generateVerificationToken()
    await user.save()

    try {
      await mailService.sendVerificationEmail(user, token)
    } catch (error) {
      logger.error({ err: error }, 'Failed to send verification email')
    }

    return response.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
      email: user.email,
    })
  }
}
