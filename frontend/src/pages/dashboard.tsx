import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/components/releases/filter-bar'
import { ReleaseGrid } from '@/components/releases/release-grid'
import { useReleases, useSyncReleases } from '@/hooks/use-releases'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useSpotifyConnection } from '@/hooks/use-spotify-connection'
import { StatusAlert, SpotifyIcon, MusicIcon } from './dashboard/sub-components'
import { toReleaseType, toReleaseSortOption } from '@/lib/type-guards'

export function DashboardPage() {
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const { addToast } = useToast()
  const syncReleases = useSyncReleases()

  const filters = {
    type: toReleaseType(searchParams.get('type')),
    artistId: searchParams.get('artist_id') || undefined,
    sort: toReleaseSortOption(searchParams.get('sort')),
    q: searchQuery || undefined,
    fromDate: searchParams.get('from_date') || undefined,
    toDate: searchParams.get('to_date') || undefined,
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useReleases(filters)
  const releases = data?.pages.flatMap((page) => page.data) || []

  const spotifyStatus = searchParams.get('spotify')
  const error = searchParams.get('error')

  const handleSync = () => {
    void syncReleases.mutateAsync().catch(() => {
      addToast('Sincronizzazione fallita. Riprova più tardi.', 'error')
    })
  }
  const hasFiltersActive = Boolean(filters.type || filters.artistId || filters.q || filters.fromDate || filters.toDate)

  if (!user?.isSpotifyConnected) {
    return <SpotifyNotConnectedView spotifyStatus={spotifyStatus} error={error} />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader onSync={handleSync} isSyncing={syncReleases.isPending} />
      <DashboardAlerts spotifyStatus={spotifyStatus} error={error} syncSuccess={syncReleases.isSuccess} />
      <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      {releases.length === 0 && !isLoading && !hasFiltersActive ? (
        <EmptyReleasesView onSync={handleSync} isSyncing={syncReleases.isPending} />
      ) : (
        <ReleaseGrid releases={releases} isLoading={isLoading} isFetchingNextPage={isFetchingNextPage} hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} />
      )}
    </div>
  )
}

/** Header with sync button */
function DashboardHeader({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-semibold text-foreground">Le tue uscite</h1>
      <Button onClick={onSync} isLoading={isSyncing} disabled={isSyncing}>
        <SyncIcon className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        Aggiorna
      </Button>
    </div>
  )
}

/** Sync icon */
function SyncIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

/** Alert messages for dashboard */
function DashboardAlerts({ spotifyStatus, error, syncSuccess }: { spotifyStatus: string | null; error: string | null; syncSuccess: boolean }) {
  return (
    <>
      {spotifyStatus === 'connected' && <StatusAlert variant="success" message="Spotify collegato con successo!" />}
      {error && <StatusAlert variant="error" message={`Errore: ${decodeURIComponent(error)}`} />}
      {syncSuccess && <StatusAlert variant="success" message="Sincronizzazione completata!" />}
    </>
  )
}

/** View when Spotify is not connected */
function SpotifyNotConnectedView({ spotifyStatus, error }: { spotifyStatus: string | null; error: string | null }) {
  const { connect } = useSpotifyConnection()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
      {spotifyStatus === 'connected' && <StatusAlert variant="success" message="Spotify collegato con successo!" />}
      {error && <StatusAlert variant="error" message={`Errore: ${decodeURIComponent(error)}`} />}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <SpotifyIcon className="mb-4 h-16 w-16 text-muted/30" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">Collega il tuo account Spotify</h3>
          <p className="mb-4 max-w-md text-sm text-muted">
            Per vedere le tue release musicali, devi prima collegare il tuo account Spotify per sincronizzare gli artisti che segui.
          </p>
          <Button onClick={() => void connect()}>Collega Spotify</Button>
        </CardContent>
      </Card>
    </div>
  )
}

/** Empty state when no releases */
function EmptyReleasesView({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <MusicIcon className="mb-4 h-16 w-16 text-muted/30" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">Nessuna release</h3>
        <p className="mb-4 max-w-md text-sm text-muted">
          Sembra che non ci siano release disponibili. Clicca su "Aggiorna" per ricaricare le uscite da Spotify.
        </p>
        <Button onClick={onSync} isLoading={isSyncing}>Aggiorna da Spotify</Button>
      </CardContent>
    </Card>
  )
}
