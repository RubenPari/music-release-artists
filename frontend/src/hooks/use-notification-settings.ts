/**
 * TanStack Query hooks for notification settings
 * 
 * @description Provides typed React Query hooks for notification settings
 * with optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NotificationSettings, UpdateNotificationSettingsPayload } from '@/types'

/**
 * Query key factory for settings
 */
export const settingsKeys = {
  all: ['settings'] as const,
  notifications: ['settings', 'notifications'] as const,
} as const

/**
 * Fetch notification settings
 */
async function fetchNotificationSettings(): Promise<NotificationSettings> {
  return api.settings.getNotifications()
}

/**
 * Update notification settings mutation
 */
async function updateNotificationSettings(
  payload: UpdateNotificationSettingsPayload
): Promise<NotificationSettings> {
  return api.settings.updateNotifications(payload)
}

/**
 * Hook for notification settings
 */
export function useNotificationSettings() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading, error } = useQuery({
    queryKey: settingsKeys.notifications,
    queryFn: fetchNotificationSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const updateMutation = useMutation({
    mutationFn: updateNotificationSettings,
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: settingsKeys.notifications })

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<NotificationSettings>(
        settingsKeys.notifications
      )

      // Optimistically update
      queryClient.setQueryData<NotificationSettings>(
        settingsKeys.notifications,
        (old) => {
          if (!old) return old
          return {
            ...old,
            notificationsEnabled: newSettings.enabled ?? old.notificationsEnabled,
            notificationFrequency: newSettings.frequency ?? old.notificationFrequency,
            notificationTypes: newSettings.types ?? old.notificationTypes,
          }
        }
      )

      return { previousSettings }
    },
    onError: (_err, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          settingsKeys.notifications,
          context.previousSettings
        )
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({queryKey: settingsKeys.notifications}).then(r => console.log(r))
     },
  })

  return {
    settings,
    isLoading,
    error,
    isUpdating: updateMutation.isPending,
    updateSettings: updateMutation.mutateAsync,
    updateError: updateMutation.error,
  }
}
