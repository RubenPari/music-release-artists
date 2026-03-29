import { Outlet } from 'react-router-dom'
import { QueryProvider } from '@/lib/query-client.js'
import { ToastProvider } from '@/components/ui/toast-context'

export function RootLayout() {
  return (
    <QueryProvider>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </QueryProvider>
  )
}
