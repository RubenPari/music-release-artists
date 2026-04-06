import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardTitle } from '@/components/ui/card'
import type { ApiError } from '@/types'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const mutation = useMutation({
    mutationFn: (payload: { token: string; password: string; passwordConfirmation: string }) =>
      api.auth.resetPassword(payload),
    onSuccess: async () => {
      await Promise.resolve()
      void navigate('/login?reset=success')
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void mutation.mutateAsync({ token, password, passwordConfirmation })
  }

  const errorMessage = mutation.error
    ? ((mutation.error as ApiError).message || 'Errore durante il reset')
    : null

  if (!token) {
    return (
      <>
        <CardTitle className="mb-6">Link non valido</CardTitle>
        <p className="text-sm text-[#6b6375]">
          Il token di reset non è presente. Richiedi un nuovo link.
        </p>
        <Button variant="outline" className="mt-4 w-full" onClick={() => void navigate('/forgot-password')}>
          Richiedi nuovo link
        </Button>
      </>
    )
  }

  return (
    <>
      <CardTitle className="mb-6">Imposta una nuova password</CardTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          name="password"
          label="Nuova password"
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
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Salva nuova password
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[#6b6375]">
        <Link to="/login" className="text-[#aa3bff] hover:underline">
          Torna al login
        </Link>
      </p>
    </>
  )
}

