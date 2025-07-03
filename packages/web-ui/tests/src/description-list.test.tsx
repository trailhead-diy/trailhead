import { render, screen } from '@testing-library/react';
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from '../../src/components/description-list';
import { describe, expect, it } from 'vitest';

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
      );

      // Test semantic structure - DL > DT/DD hierarchy
      const list = document.querySelector('dl');
      expect(list).toBeInTheDocument();
      expect(list?.tagName).toBe('DL');

      const terms = screen.getAllByText(/Full Name|Skills|Contact/);
      terms.forEach(term => {
        expect(term.closest('dt')).toBeInTheDocument();
      });
    });

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
      );

      const list = screen.getByLabelText('User information');
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe('DL');
    });
  });
});
