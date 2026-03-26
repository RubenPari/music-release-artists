import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const spotifyStatus = searchParams.get('spotify')
    const spotifyError = searchParams.get('spotify_error')

    if (spotifyError) {
      navigate(`/dashboard?error=${encodeURIComponent(spotifyError)}`)
      return
    }

    if (spotifyStatus === 'connected') {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      navigate('/dashboard?spotify=connected')
    } else {
      navigate('/dashboard')
    }
  }, [searchParams, navigate, queryClient])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#aa3bff] border-t-transparent" />
        <p className="text-[#6b6375]">Collegamento in corso...</p>
      </div>
    </div>
  )
}
