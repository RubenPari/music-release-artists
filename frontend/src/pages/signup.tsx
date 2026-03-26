import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardTitle } from '@/components/ui/card'

export function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const { signup, isSigningUp, signupError } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await signup({ fullName, email, password, passwordConfirmation })
      navigate('/dashboard')
    } catch {
      // Error handled by useAuth
    }
  }

  return (
    <>
      <CardTitle className="mb-6">Crea un account</CardTitle>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          name="fullName"
          label="Nome completo"
          placeholder="Mario Rossi"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />

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
          autoComplete="new-password"
        />

        <Input
          type="password"
          name="passwordConfirmation"
          label="Conferma password"
          placeholder="••••••••"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          required
          autoComplete="new-password"
        />

        {signupError && (
          <p className="text-sm text-red-500">
            {typeof signupError === 'object' && 'message' in signupError
              ? (signupError as { message: string }).message
              : 'Errore durante la registrazione'}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isSigningUp}>
          Registrati
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[#6b6375]">
        Hai gia un account?{' '}
        <Link to="/login" className="text-[#aa3bff] hover:underline">
          Accedi
        </Link>
      </p>
    </>
  )
}
