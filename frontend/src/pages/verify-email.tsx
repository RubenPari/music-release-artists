import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardTitle } from '@/components/ui/card'
import type { ApiError } from '@/types'

export function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (payload: { email: string }) => api.auth.resendVerificationEmail(payload),
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
        <CardTitle className="mb-6">Email inviata</CardTitle>
        <div className="space-y-4 text-center">
          <p className="text-[#6b6375]">
            Se esiste un account con questa email, ti abbiamo inviato una nuova email di verifica.
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
      <CardTitle className="mb-6">Verifica email</CardTitle>
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
          Reinvia email di verifica
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

