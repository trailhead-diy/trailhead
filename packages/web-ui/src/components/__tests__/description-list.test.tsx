import { render, screen } from '@testing-library/react'
import { DescriptionList, DescriptionTerm, DescriptionDetails } from '../description-list'
import { describe, expect, it } from 'vitest'

describe('DescriptionList Components', () => {
  describe('Semantic Structure', () => {
    it('should render semantic description list with proper HTML elements', () => {
      render(
        <DescriptionList>
          <DescriptionTerm>
            <strong>Full Name</strong>
          </DescriptionTerm>
          <DescriptionDetails>John Doe</DescriptionDetails>
          <DescriptionTerm>Skills</DescriptionTerm>
          <DescriptionDetails>JavaScript</DescriptionDetails>
          <DescriptionDetails>TypeScript</DescriptionDetails>
          <DescriptionDetails>React</DescriptionDetails>
          <DescriptionTerm>Contact</DescriptionTerm>
          <DescriptionDetails>
            <div>
              <p>
                Email: <em>john@example.com</em>
              </p>
              <p>
                Phone: <code>+1-555-0123</code>
              </p>
            </div>
          </DescriptionDetails>
        </DescriptionList>
      )

      // Test semantic structure - DL > DT/DD hierarchy
      const list = document.querySelector('dl')
      expect(list).toBeInTheDocument()
      expect(list?.tagName).toBe('DL')

      const terms = screen.getAllByText(/Full Name|Skills|Contact/)
      terms.forEach((term) => {
        expect(term.closest('dt')).toBeInTheDocument()
      })

      // Test complex content rendering
      expect(screen.getByText('Full Name')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('+1-555-0123')).toBeInTheDocument()
    })

    it('should handle multiple patterns and accessibility', () => {
      render(
        <div>
          <DescriptionList aria-label="User information">
            <DescriptionTerm>Languages</DescriptionTerm>
            <DescriptionDetails>English</DescriptionDetails>
            <DescriptionDetails>Spanish</DescriptionDetails>
            <DescriptionDetails>French</DescriptionDetails>
          </DescriptionList>

          <DescriptionTerm>Standalone Term</DescriptionTerm>
          <DescriptionDetails>Standalone Details</DescriptionDetails>
        </div>
      )

      const list = screen.getByLabelText('User information')
      expect(list).toBeInTheDocument()
      expect(list.tagName).toBe('DL')

      // Test multiple details for one term
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Spanish')).toBeInTheDocument()
      expect(screen.getByText('French')).toBeInTheDocument()

      // Test standalone components
      expect(screen.getByText('Standalone Term')).toBeInTheDocument()
      expect(screen.getByText('Standalone Details')).toBeInTheDocument()
    })
  })
})
