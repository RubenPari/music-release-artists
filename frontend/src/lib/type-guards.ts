import type { ReleaseType, ReleaseSortOption } from '@/types'

const RELEASE_TYPES: ReleaseType[] = ['album', 'single', 'ep', 'compilation']
const SORT_OPTIONS: ReleaseSortOption[] = ['release_date_desc', 'release_date_asc']

export function toReleaseType(value: string | null): ReleaseType | undefined {
  if (value && RELEASE_TYPES.includes(value as ReleaseType)) return value as ReleaseType
  return undefined
}

export function toReleaseSortOption(value: string | null): ReleaseSortOption | undefined {
  if (value && SORT_OPTIONS.includes(value as ReleaseSortOption)) return value as ReleaseSortOption
  return undefined
}

export function isApiError(error: unknown): error is { message: string } {
  return error !== null && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string'
}

export function extractApiError(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message
  return fallback
}
