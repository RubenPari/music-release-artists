import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/components/releases/filter-bar'
import { ReleaseGrid } from '@/components/releases/release-grid'
import { useReleases, useSyncReleases } from '@/hooks/use-releases'
import { useAuth } from '@/hooks/use-auth'

export function DashboardPage() {
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const syncReleases = useSyncReleases()

  const spotifyStatus = searchParams.get('spotify')
  const error = searchParams.get('error')

  const filters = {
    type: searchParams.get('type') || undefined,
    artistId: searchParams.get('artist_id') || undefined,
    sort: searchParams.get('sort') || undefined,
    q: searchQuery || undefined,
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useReleases(filters)

  const releases = data?.pages.flatMap((page) => page.data) || []

  const handleSync = async () => {
    try {
      await syncReleases.mutateAsync()
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }

  const hasFiltersActive = filters.type || filters.artistId || filters.q

  if (!user?.isSpotifyConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-[#08060d]">Dashboard</h1>

        {spotifyStatus === 'connected' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-2 py-3 text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Spotify collegato con successo!
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-3 text-red-700">
              Errore: {decodeURIComponent(error)}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="mb-4 h-16 w-16 text-[#6b6375]/30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-[#08060d]">Collega il tuo account Spotify</h3>
            <p className="mb-4 max-w-md text-sm text-[#6b6375]">
              Per vedere le tue release musicali, devi prima collegare il tuo account Spotify per
              sincronizzare gli artisti che segui.
            </p>
            <Button onClick={() => window.location.href = '/api/v1/spotify/redirect'}>
              Collega Spotify
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-[#08060d]">Le tue uscite</h1>
        <Button
          onClick={handleSync}
          isLoading={syncReleases.isPending}
          disabled={syncReleases.isPending}
        >
          <svg
            className={`mr-2 h-4 w-4 ${syncReleases.isPending ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Aggiorna
        </Button>
      </div>

      {spotifyStatus === 'connected' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 py-3 text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Spotify collegato con successo!
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-red-700">
            Errore: {decodeURIComponent(error)}
          </CardContent>
        </Card>
      )}

      {syncReleases.isSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 py-3 text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Sincronizzazione completata!
          </CardContent>
        </Card>
      )}

      <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {releases.length === 0 && !isLoading && !hasFiltersActive ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="mb-4 h-16 w-16 text-[#6b6375]/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-[#08060d]">Nessuna release</h3>
            <p className="mb-4 max-w-md text-sm text-[#6b6375]">
              Sembra che non ci siano release sincronizzate. Clicca su "Aggiorna" per importare le
              uscite dei tuoi artisti da Spotify.
            </p>
            <Button onClick={handleSync} isLoading={syncReleases.isPending}>
              Sincronizza le tue uscite
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ReleaseGrid
          releases={releases}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}
    </div>
  )
}
