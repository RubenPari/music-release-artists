import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export function useSpotifyConnection() {
  const { addToast } = useToast()

  const connect = async () => {
    const data = await api.spotify.getRedirectUrl()
    window.location.href = data.data.url
  }

  const disconnect = async () => {
    try {
      await api.spotify.disconnect()
      window.location.reload()
    } catch {
      addToast('Impossibile scollegare Spotify. Riprova più tardi.', 'error')
    }
  }

  return { connect, disconnect }
}
