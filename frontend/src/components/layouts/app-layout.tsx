import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

export function AppLayout() {
  const { user, isSpotifyConnected, logout, isLoggingOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleConnectSpotify() {
    const data = await api.spotify.getRedirectUrl()
    window.location.href = data.data.url
  }

  return (
    <div className="min-h-screen bg-[#f4f3ec]">
      <nav className="border-b border-[#e5e4e7] bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/dashboard" className="text-xl font-semibold text-[#08060d]">
            Music Release Artists
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#aa3bff] text-sm font-medium text-white">
                    {user.initials}
                  </div>
                  <span className="text-sm text-[#6b6375]">{user.fullName || user.email}</span>
                </div>

                <div className="h-4 w-px bg-[#e5e4e7]" />

                <div className="flex items-center gap-2">
                  {isSpotifyConnected ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Spotify collegato
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-[#6b6375]">
                      <span className="h-2 w-2 rounded-full bg-[#e5e4e7]" />
                      Spotify non collegato
                    </span>
                  )}
                </div>

                {!isSpotifyConnected && (
                  <Button variant="outline" size="sm" onClick={handleConnectSpotify}>
                    Collega Spotify
                  </Button>
                )}

                <div className="h-4 w-px bg-[#e5e4e7]" />

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
