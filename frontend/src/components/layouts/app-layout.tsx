import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useSpotifyConnection } from '@/hooks/use-spotify-connection'
import { Button } from '@/components/ui/button'

export function AppLayout() {
  const { user, isSpotifyConnected, logout, isLoggingOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    void logout().then(() => navigate('/login'))
  }

  const { connect: handleConnectSpotify } = useSpotifyConnection()

  return (
    <div className="min-h-screen bg-surface">
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/dashboard" className="text-xl font-semibold text-foreground">
            Music Release Artists
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-medium text-white">
                    {user.initials}
                  </div>
                  <span className="text-sm text-muted">{user.fullName || user.email}</span>
                </div>

                <div className="h-4 w-px bg-border" />

                <div className="flex items-center gap-2">
                  {isSpotifyConnected ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Spotify collegato
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-muted">
                      <span className="h-2 w-2 rounded-full bg-border" />
                      Spotify non collegato
                    </span>
                  )}
                </div>

                {!isSpotifyConnected && (
                  <Button variant="outline" size="sm" onClick={() => void handleConnectSpotify()}>
                    Collega Spotify
                  </Button>
                )}

                <div className="h-4 w-px bg-border" />

                <Link to="/settings" className="text-sm text-muted hover:text-foreground transition-colors">
                  Impostazioni
                </Link>

                <div className="h-4 w-px bg-border" />

                <Button variant="ghost" size="sm" onClick={handleLogout} isLoading={isLoggingOut}>
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
