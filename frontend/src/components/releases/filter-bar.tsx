import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useArtists } from '@/hooks/use-artists'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const typeOptions = [
  { value: '', label: 'Tutti i tipi' },
  { value: 'album', label: 'Album' },
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'compilation', label: 'Compilation' },
]

const sortOptions = [
  { value: 'release_date_desc', label: 'Più recenti' },
  { value: 'release_date_asc', label: 'Meno recenti' },
]

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function FilterBar({ searchQuery, onSearchChange }: FilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: artistsData } = useArtists()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

  const currentType = searchParams.get('type') || ''
  const currentArtistId = searchParams.get('artist_id') || ''
  const currentSort = searchParams.get('sort') || 'release_date_desc'

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const artistOptions = [
    { value: '', label: 'Tutti gli artisti' },
    ...(artistsData?.data.map((artist) => ({
      value: artist.id.toString(),
      label: artist.name,
    })) || []),
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex-1 min-w-[200px]">
          <Input
          type="text"
          placeholder="Cerca per titolo o artista..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="w-40">
        <Select
          options={typeOptions}
          value={currentType}
          onChange={(e) => updateFilter('type', e.target.value)}
        />
      </div>

      <div className="w-48">
        <Select
          options={artistOptions}
          value={currentArtistId}
          onChange={(e) => updateFilter('artist_id', e.target.value)}
          disabled={!artistsData?.data.length}
        />
      </div>

      <div className="w-40">
        <Select
          options={sortOptions}
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
        />
      </div>
    </div>
  )
}
