import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardTitle } from '@/components/ui/card'
import type { ApiError } from '@/types'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (payload: { email: string }) => api.auth.forgotPassword(payload),
    onSuccess: () => setSubmitted(true),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void mutation.mutateAsync({ email })
  }

  const errorMessage = mutation.error
    ? ((mutation.error as ApiError).message || 'Errore durante la richiesta')
    : null

  if (submitted) {
    return (
      <>
        <CardTitle className="mb-6">Controlla la tua email</CardTitle>
        <div className="space-y-4 text-center">
          <p className="text-muted">
            Se esiste un account con questa email, ti abbiamo inviato un link per reimpostare la password.
          </p>
          <Button variant="outline" className="w-full" onClick={() => void navigate('/login')}>
            Torna al login
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <CardTitle className="mb-6">Password dimenticata</CardTitle>
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
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Invia link di reset
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Ti sei ricordato la password?{' '}
        <Link to="/login" className="text-brand hover:underline">
          Accedi
        </Link>
      </p>
    </>
  )
}

