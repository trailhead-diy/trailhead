import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Heading, Subheading } from '../heading'

describe('Heading', () => {
  describe('Accessibility', () => {
    it('should provide proper heading hierarchy for screen readers', () => {
      render(
        <div>
          <Heading level={1}>Main Title</Heading>
          <Heading level={2}>Section Title</Heading>
          <Heading level={3}>Subsection Title</Heading>
        </div>
      )

      const headings = screen.getAllByRole('heading')
      expect(headings).toHaveLength(3)

      // Verify heading hierarchy exists
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title')
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section Title')
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Subsection Title')
    })

    it('should support aria-label for additional context', () => {
      render(
        <Heading level={1} aria-label="Main navigation heading">
          Products
        </Heading>
      )

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveAttribute('aria-label', 'Main navigation heading')
    })

    it('should support id for anchor links', () => {
      render(
        <Heading level={2} id="getting-started">
          Getting Started
        </Heading>
      )

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveAttribute('id', 'getting-started')
    })
  })
})

describe('Subheading', () => {
  describe('Accessibility', () => {
    it('should render with appropriate heading level', () => {
      render(
        <div>
          <Heading level={1}>Main Section</Heading>
          <Subheading level={2}>Subsection Details</Subheading>
        </div>
      )

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Subsection Details')
    })
  })
})
