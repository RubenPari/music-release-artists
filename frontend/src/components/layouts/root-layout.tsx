import { Outlet } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-config.js'
import { ToastProvider } from '@/components/ui/toast-context'

export function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </QueryClientProvider>
  )
}
