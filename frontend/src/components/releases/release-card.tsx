import type { Release } from '@/types'
import { Badge } from '@/components/ui/badge'

interface ReleaseCardProps {
  release: Release
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const typeLabels = {
  album: 'Album',
  single: 'Single',
  ep: 'EP',
  compilation: 'Compilation',
}

export function ReleaseCard({ release }: ReleaseCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md">
      <div className="aspect-square overflow-hidden bg-[#f4f3ec]">
        {release.coverUrl ? (
          <img
            src={release.coverUrl}
            alt={`${release.title} cover`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-16 w-16 text-[#6b6375]/30"
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
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[#08060d] line-clamp-1" title={release.title}>
            {release.title}
          </h3>
          <Badge variant={release.type}>{typeLabels[release.type]}</Badge>
        </div>

        <p className="mb-1 text-sm text-[#6b6375] line-clamp-1">{release.artist.name}</p>
        <p className="mb-3 text-xs text-[#6b6375]/70">{formatDate(release.releaseDate)}</p>

        <a
          href={release.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#aa3bff] transition-colors hover:text-[#9331e6]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Apri su Spotify
        </a>
      </div>
    </div>
  )
}
