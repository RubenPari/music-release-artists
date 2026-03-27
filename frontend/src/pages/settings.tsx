import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NotificationForm } from '@/components/settings/notification-form'
import { useAuth } from '@/hooks/use-auth'

export function SettingsPage() {
  const { user, isLoading: isLoadingUser } = useAuth()

  const handleSpotifyConnect = () => {
    window.location.href = '/api/v1/spotify/redirect'
  }

  const handleSpotifyDisconnect = async () => {
    try {
      await fetch('/api/v1/spotify/disconnect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      window.location.reload()
    } catch (err) {
      console.error('Failed to disconnect Spotify:', err)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-[#08060d]">Impostazioni</h1>

      <section className="space-y-6">
        <h2 className="text-lg font-medium text-[#08060d]">Profilo</h2>

        <Card>
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {isLoadingUser ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f3ec]">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-[#e5e4e7]" />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#aa3bff] text-white font-semibold">
                  {user?.initials || '??'}
                </div>
              )}

              <div>
                {isLoadingUser ? (
                  <div className="space-y-2">
                    <div className="h-5 w-32 animate-pulse rounded bg-[#f4f3ec]" />
                    <div className="h-4 w-48 animate-pulse rounded bg-[#f4f3ec]" />
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-[#08060d]">
                      {user?.fullName || user?.email}
                    </p>
                    <p className="text-sm text-[#6b6375]">{user?.email}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user?.isSpotifyConnected ? (
                <>
                  <span className="flex items-center gap-2 text-sm text-green-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    Spotify collegato
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSpotifyDisconnect}>
                    Scollega
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-[#6b6375]">Spotify non collegato</span>
                  <Button size="sm" onClick={handleSpotifyConnect}>
                    Collega Spotify
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-medium text-[#08060d]">Notifiche</h2>
        <NotificationForm />
      </section>
    </div>
  )
}
