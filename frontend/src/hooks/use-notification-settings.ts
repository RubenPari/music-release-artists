import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface NotificationSettings {
  notificationsEnabled: boolean
  notificationFrequency: 'daily' | 'weekly'
  notificationTypes: string[]
}

interface UpdateSettingsPayload {
  enabled?: boolean
  frequency?: 'daily' | 'weekly'
  types?: string[]
}

export function useNotificationSettings() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const response = await api.get<NotificationSettings>('/settings/notifications')
      return response.data
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: UpdateSettingsPayload) => {
      const response = await api.patch<NotificationSettings>('/settings/notifications', payload)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-settings'], data)
    },
  })

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  }
}
