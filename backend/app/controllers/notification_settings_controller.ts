import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { notificationSettingsValidator } from '#validators/notification_settings'
import encryption from '@adonisjs/core/services/encryption'
import { RELEASE_TYPES } from '#utils/constants'

const DEFAULT_NOTIFICATION_TYPES = [...RELEASE_TYPES]

function parseNotificationTypes(value: string | null): string[] {
  if (!value) return DEFAULT_NOTIFICATION_TYPES
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : DEFAULT_NOTIFICATION_TYPES
  } catch {
    return DEFAULT_NOTIFICATION_TYPES
  }
}

function serializeSettings(user: User) {
  return {
    notificationsEnabled: user.notificationsEnabled ?? false,
    notificationFrequency: user.notificationFrequency ?? 'daily',
    notificationTypes: parseNotificationTypes(user.notificationTypes),
    notificationEmail: user.notificationEmail ?? user.email,
  }
}

export default class NotificationSettingsController {
  async show({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return serializeSettings(user)
  }

  async update({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(notificationSettingsValidator)

    if (data.enabled !== undefined) {
      user.notificationsEnabled = data.enabled
    }

    if (data.frequency !== undefined) {
      user.notificationFrequency = data.frequency
    }

    if (data.types !== undefined) {
      user.notificationTypes = JSON.stringify(data.types)
    }

    if (data.email !== undefined) {
      user.notificationEmail = data.email
    }

    await user.save()

    return serializeSettings(user)
  }

  async unsubscribe({ request, response }: HttpContext) {
    const { token } = request.only(['token'])

    if (!token) {
      return response.badRequest({ message: 'Token is required' })
    }

    let payload: { userId: number; purpose: string } | null = null

    try {
      payload = encryption.decrypt(token)
    } catch {
      return response.badRequest({ message: 'Invalid token' })
    }

    if (!payload || payload.purpose !== 'unsubscribe') {
      return response.badRequest({ message: 'Invalid token purpose' })
    }

    const user = await User.find(payload.userId)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    user.notificationsEnabled = false
    await user.save()

    return { message: 'Successfully unsubscribed from notifications' }
  }
}
