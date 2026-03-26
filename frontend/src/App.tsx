import { Routes, Route, Navigate } from 'react-router-dom'
import { RootLayout } from '@/components/layouts/root-layout'
import { AppLayout } from '@/components/layouts/app-layout'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { LoginPage } from '@/pages/login'
import { SignupPage } from '@/pages/signup'
import { CallbackPage } from '@/pages/callback'
import { DashboardPage } from '@/pages/dashboard'
import { SettingsPage } from '@/pages/settings'

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route
            path="/callback"
            element={
              <ProtectedRoute>
                <CallbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
