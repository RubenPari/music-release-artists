import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { setToken } from '@/lib/api'
import { authKeys } from '@/hooks/use-auth'

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    async function handleCallback() {
      const verified = searchParams.get('verified')
      const token = searchParams.get('token')
      const verifyError = searchParams.get('verify_error')
      const spotifyStatus = searchParams.get('spotify')
      const spotifyError = searchParams.get('spotify_error')

      if (verifyError) {
        void navigate(`/login?error=${encodeURIComponent(verifyError)}`)
        return
      }

      if (verified === 'true' && token) {
        setToken(token)
        await queryClient.invalidateQueries({queryKey: authKeys.user})
        void navigate('/dashboard?verified=true')
        return
      }

      if (spotifyError) {
        void navigate(`/dashboard?error=${encodeURIComponent(spotifyError)}`)
        return
      }

      if (spotifyStatus === 'connected') {
        await queryClient.invalidateQueries({ queryKey: authKeys.user })
        void navigate('/dashboard?spotify=connected')
        return
      }

      void navigate('/dashboard')
    }

    void handleCallback()
  }, [searchParams, navigate, queryClient])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="text-muted">Elaborazione...</p>
      </div>
    </div>
  )
}
