import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NotificationForm } from '@/components/settings/notification-form'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/api'

type Tab = 'profile' | 'notifications'

const TABS: { value: Tab; label: string }[] = [
  { value: 'profile', label: 'Profilo' },
  { value: 'notifications', label: 'Notifiche' },
]

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'profile'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const { user, isLoading: isLoadingUser } = useAuth()

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-[#08060d]">Impostazioni</h1>

      <div className="flex gap-1 border-b border-[#e5e4e7]">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`
              px-4 py-2.5 text-sm font-medium transition-colors relative
              ${activeTab === tab.value
                ? 'text-[#aa3bff]'
                : 'text-[#6b6375] hover:text-[#08060d]'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#aa3bff]" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <ProfileSection user={user} isLoading={isLoadingUser} />
      )}

      {activeTab === 'notifications' && (
        <NotificationForm />
      )}
    </div>
  )
}

function ProfileSection({ user, isLoading }: { user: ReturnType<typeof useAuth>['user']; isLoading: boolean }) {
  const handleSpotifyConnect = async () => {
    const data = await api.spotify.getRedirectUrl()
    window.location.href = data.data.url
  }

  const handleSpotifyDisconnect = async () => {
    try {
      await api.spotify.disconnect()
      window.location.reload()
    } catch (err) {
      console.error('Failed to disconnect Spotify:', err)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f3ec]">
              <div className="h-6 w-6 animate-pulse rounded-full bg-[#e5e4e7]" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#aa3bff] text-white font-semibold">
              {user?.initials || '??'}
            </div>
          )}

          <div>
            {isLoading ? (
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
              <Button variant="outline" size="sm" onClick={() => void handleSpotifyDisconnect()}>
                Scollega
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-[#6b6375]">Spotify non collegato</span>
              <Button size="sm" onClick={() => void handleSpotifyConnect()}>
                Collega Spotify
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
