import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Link } from '../../src/components/link'

describe('Link', () => {
  describe('Navigation Behavior', () => {
    it('should handle different types of navigation', () => {
      render(
        <div>
          <Link href="https://example.com">External Link</Link>
          <Link href="/about">Internal Link</Link>
          <Link href="#section">Anchor Link</Link>
        </div>
      )

      const externalLink = screen.getByRole('link', { name: 'External Link' })
      const internalLink = screen.getByRole('link', { name: 'Internal Link' })
      const anchorLink = screen.getByRole('link', { name: 'Anchor Link' })

      expect(externalLink).toHaveAttribute('href', 'https://example.com')
      expect(internalLink).toHaveAttribute('href', '/about')
      expect(anchorLink).toHaveAttribute('href', '#section')
    })

    it('should open external links safely in new tab', () => {
      render(
        <Link href="https://example.com" target="_blank" rel="noopener noreferrer">
          External Link
        </Link>
      )

      const link = screen.getByRole('link', { name: 'External Link' })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Accessibility States', () => {
    it('should support disabled state for accessibility', () => {
      render(
        <Link href="#test" aria-disabled="true">
          Disabled Link
        </Link>
      )

      const link = screen.getByRole('link', { name: 'Disabled Link' })
      expect(link).toHaveAttribute('aria-disabled', 'true')
    })

    it('should indicate current page in navigation', () => {
      render(
        <Link href="/current" aria-current="page">
          Current Page
        </Link>
      )

      const link = screen.getByRole('link', { name: 'Current Page' })
      expect(link).toHaveAttribute('aria-current', 'page')
    })
  })
})
