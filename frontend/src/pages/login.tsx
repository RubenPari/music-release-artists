import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardTitle } from '@/components/ui/card'
import * as React from "react";

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoggingIn, loginError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const urlError = searchParams.get('error')
  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'

  function isNeedsVerificationError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'needsVerification' in error) {
      return (error as { needsVerification: boolean }).needsVerification
    }
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch {
      // Error handled by useAuth
    }
  }

  const errorMessage = loginError
    ? isNeedsVerificationError(loginError)
      ? 'Devi verificare la tua email prima di accedere.'
      : 'Email o password non validi'
    : urlError || null

  const needsVerification = loginError && isNeedsVerificationError(loginError)

  return (
    <>
      <CardTitle className="mb-6">Accedi</CardTitle>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          type="password"
          name="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {errorMessage && (
          <div className={`rounded-lg p-3 text-sm ${needsVerification ? 'bg-[#aa3bff]/10 text-[#aa3bff]' : 'bg-red-50 text-red-500'}`}>
            {errorMessage}
            {needsVerification && (
              <Link to="/verify-email" className="ml-2 font-medium hover:underline">
                Verifica email
              </Link>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={isLoggingIn}>
          Accedi
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[#6b6375]">
        Non hai un account?{' '}
        <Link to="/signup" className="text-[#aa3bff] hover:underline">
          Registrati
        </Link>
      </p>
    </>
  )
}
