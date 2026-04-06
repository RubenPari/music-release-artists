import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Album</Badge>)
    expect(screen.getByText('Album')).toBeInTheDocument()
  })

  it('applies variant class for album', () => {
    render(<Badge variant="album">Album</Badge>)
    const el = screen.getByText('Album')
    expect(el.className).toContain('text-brand')
  })

  it('applies default variant when none specified', () => {
    render(<Badge>Tag</Badge>)
    const el = screen.getByText('Tag')
    expect(el.className).toContain('text-muted')
  })
})
