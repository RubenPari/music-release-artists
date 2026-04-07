import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useArtists } from '@/hooks/use-artists'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FILTER_TYPE_OPTIONS, SORT_OPTIONS, SEARCH_DEBOUNCE_MS } from '@/lib/constants'

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function FilterBar({ searchQuery, onSearchChange }: FilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: artistsData } = useArtists()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(localSearch), SEARCH_DEBOUNCE_MS)
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

  const hasDateFilter = searchParams.get('from_date') || searchParams.get('to_date')

  const clearDates = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('from_date')
    newParams.delete('to_date')
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <SearchInput value={localSearch} onChange={setLocalSearch} />
        <Select options={FILTER_TYPE_OPTIONS} value={searchParams.get('type') || ''} onChange={(e) => updateFilter('type', e.target.value)} />
        <Select options={artistOptions} value={searchParams.get('artist_id') || ''} onChange={(e) => updateFilter('artist_id', e.target.value)} disabled={!artistsData?.data.length} />
        <Select options={SORT_OPTIONS} value={searchParams.get('sort') || 'release_date_desc'} onChange={(e) => updateFilter('sort', e.target.value)} />
      </div>
      <div className="flex items-center gap-3 border-t border-border pt-3">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">Periodo</span>
        <input
          type="date"
          value={searchParams.get('from_date') || ''}
          onChange={(e) => updateFilter('from_date', e.target.value)}
          className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        />
        <span className="text-xs text-muted">&ndash;</span>
        <input
          type="date"
          value={searchParams.get('to_date') || ''}
          onChange={(e) => updateFilter('to_date', e.target.value)}
          className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        />
        {hasDateFilter && (
          <button
            onClick={clearDates}
            className="text-xs text-muted hover:text-foreground transition-colors underline underline-offset-2"
          >
            Resetta
          </button>
        )}
      </div>
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
