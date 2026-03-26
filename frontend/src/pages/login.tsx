import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoggingIn, loginError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch {
      // Error handled by useAuth
    }
  }

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

        {loginError && (
          <p className="text-sm text-red-500">Email o password non validi</p>
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
