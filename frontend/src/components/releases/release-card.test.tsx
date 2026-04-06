import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ReleaseCard } from './release-card'
import type { Release } from '@/types'

const mockRelease: Release = {
  id: '1',
  spotifyReleaseId: 'abc123',
  title: 'Midnight Dreams',
  type: 'album',
  coverUrl: 'https://example.com/cover.jpg',
  releaseDate: '2025-01-15',
  spotifyUrl: 'https://open.spotify.com/album/abc123',
  artist: {
    id: 1,
    spotifyArtistId: 'artist123',
    name: 'Test Artist',
    imageUrl: null,
    genres: ['rock'],
    followers: 1000,
    lastSyncedAt: null,
  },
}

describe('ReleaseCard', () => {
  it('renders release title and artist', () => {
    render(<ReleaseCard release={mockRelease} />)
    expect(screen.getByText('Midnight Dreams')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })

  it('renders release type badge', () => {
    render(<ReleaseCard release={mockRelease} />)
    expect(screen.getByText('Album')).toBeInTheDocument()
  })

  it('renders Spotify link', () => {
    render(<ReleaseCard release={mockRelease} />)
    const link = screen.getByText('Apri su Spotify')
    expect(link).toHaveAttribute('href', 'https://open.spotify.com/album/abc123')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders cover image when available', () => {
    render(<ReleaseCard release={mockRelease} />)
    const img = screen.getByAltText('Midnight Dreams cover')
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg')
  })

  it('renders placeholder when no cover', () => {
    const noCover = { ...mockRelease, coverUrl: null }
    const { container } = render(<ReleaseCard release={noCover} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('formats date in Italian locale', () => {
    render(<ReleaseCard release={mockRelease} />)
    // Italian date format: "15 gen 2025"
    expect(screen.getByText(/15.*gen.*2025/i)).toBeInTheDocument()
  })
})
