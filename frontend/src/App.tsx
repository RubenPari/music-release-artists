import { Routes, Route, Navigate } from 'react-router-dom'
import { RootLayout } from '@/components/layouts/root-layout'
import { AppLayout } from '@/components/layouts/app-layout'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { LoginPage } from '@/pages/login'
import { SignupPage } from '@/pages/signup'
import { ForgotPasswordPage } from '@/pages/forgot-password'
import { ResetPasswordPage } from '@/pages/reset-password'
import { VerifyEmailPage } from '@/pages/verify-email'
import { CallbackPage } from '@/pages/callback'
import { DashboardPage } from '@/pages/dashboard'
import { SettingsPage } from '@/pages/settings'
import { NotFoundPage } from '@/pages/not-found'

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/callback" element={<CallbackPage />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
