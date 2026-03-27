import type User from '#models/user'
import type { UserDTO } from '#types/api'

/**
 * UserTransformer - Transforms User model to DTO
 *
 * @description Provides type-safe transformation of User model
 * with computed fields like initials.
 */
export class UserTransformer {
  /**
   * Transform a single user
   */
  static toObject(user: User): UserDTO {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt.toISO()!,
      updatedAt: user.updatedAt.toISO()!,
      initials: this.computeInitials(user),
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      country: user.country,
      isSpotifyConnected: !!user.spotifyId,
      notificationsEnabled: user.notificationsEnabled,
      notificationFrequency: user.notificationFrequency,
      notificationTypes: user.notificationTypes,
    }
  }

  /**
   * Compute user initials from fullName or email
   */
  private static computeInitials(user: User): string {
    const fullName = user.fullName
    if (fullName) {
      const parts = fullName.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return fullName.slice(0, 2).toUpperCase()
    }

    const email = user.email
    return email.slice(0, 2).toUpperCase()
  }

  /**
   * Transform multiple users
   */
  static transform(users: User[]): UserDTO[] {
    return users.map((user) => this.toObject(user))
  }
}

export default UserTransformer
