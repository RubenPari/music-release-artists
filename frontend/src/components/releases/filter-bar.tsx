import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useArtists } from '@/hooks/use-artists'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const TYPE_OPTIONS = [
  { value: '', label: 'Tutti i tipi' },
  { value: 'album', label: 'Album' },
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'compilation', label: 'Compilation' },
]

const SORT_OPTIONS = [
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
    const timer = setTimeout(() => onSearchChange(localSearch), 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

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
    ...(artistsData?.data.map((artist) => ({ value: artist.id.toString(), label: artist.name })) || []),
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <SearchInput value={localSearch} onChange={setLocalSearch} />
      <Select options={TYPE_OPTIONS} value={searchParams.get('type') || ''} onChange={(e) => updateFilter('type', e.target.value)} />
      <Select options={artistOptions} value={searchParams.get('artist_id') || ''} onChange={(e) => updateFilter('artist_id', e.target.value)} disabled={!artistsData?.data.length} />
      <Select options={SORT_OPTIONS} value={searchParams.get('sort') || 'release_date_desc'} onChange={(e) => updateFilter('sort', e.target.value)} />
    </div>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1 min-w-50">
      <Input type="text" placeholder="Cerca per titolo o artista..." value={value} onChange={(e) => onChange(e.target.value)} className="w-full" />
    </div>
  )
}
