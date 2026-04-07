import type User from '#models/user'
import { RELEASE_TYPES } from '#utils/constants'

const DEFAULT_NOTIFICATION_TYPES = [...RELEASE_TYPES]

export function parseNotificationTypes(value: string | null): string[] {
  if (!value) return DEFAULT_NOTIFICATION_TYPES
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : DEFAULT_NOTIFICATION_TYPES
  } catch {
    return DEFAULT_NOTIFICATION_TYPES
  }
}

export function serializeNotificationSettings(user: User) {
  return {
    notificationsEnabled: user.notificationsEnabled ?? false,
    notificationFrequency: user.notificationFrequency ?? 'daily',
    notificationTypes: parseNotificationTypes(user.notificationTypes),
    notificationEmail: user.notificationEmail ?? user.email,
  }
}
