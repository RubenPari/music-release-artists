import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { CardTitle } from '@/components/ui/card'
import type { ApiError } from '@/types'

interface VerifyEmailPageProps {
  email?: string
}

interface ResendResponse {
  message: string
  email: string
}

export function VerifyEmailPage({ email }: VerifyEmailPageProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resendMutation = useMutation<ResendResponse, ApiError>({
    mutationFn: async () => {
      const response = await api.post<ResendResponse>('/auth/verify-email/resend')
      return response.data
    },
    onSuccess: (data) => {
      setMessage(data.message)
      setError(null)
    },
    onError: (err) => {
      setError(err.message)
      setMessage(null)
    },
  })

  async function handleResend() {
    setMessage(null)
    setError(null)
    await resendMutation.mutateAsync()
  }

  return (
    <>
      <CardTitle className="mb-6">Verifica la tua email</CardTitle>

      <div className="space-y-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#aa3bff]/10">
          <svg
            className="h-8 w-8 text-[#aa3bff]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <p className="text-[#6b6375]">
          {email ? (
            <>
              Abbiamo inviato un'email di verifica a{' '}
              <strong className="text-[#08060d]">{email}</strong>
            </>
          ) : (
            'Abbiamo inviato un\'email di verifica al tuo indirizzo email.'
          )}
        </p>

        <p className="text-sm text-[#6b6375]">
          Clicca sul link nell'email per attivare il tuo account.
        </p>

        {message && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          variant="outline"
          className="mt-4"
          onClick={handleResend}
          isLoading={resendMutation.isPending}
        >
          Reinvia email di verifica
        </Button>
      </div>
    </>
  )
}
