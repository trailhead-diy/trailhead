import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Divider } from '../../src/components/divider';

describe('Divider Component', () => {
  describe('HTML Semantic Behavior', () => {
    it('should support standard HTML hr attributes', () => {
      render(
        <Divider
          data-testid="divider"
          id="test-divider"
          aria-hidden="true"
          title="Section separator"
        />
      );

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveAttribute('id', 'test-divider');
      expect(divider).toHaveAttribute('aria-hidden', 'true');
      expect(divider).toHaveAttribute('title', 'Section separator');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should work correctly with screen reader testing', () => {
      render(
        <div>
          <p>Section 1 content</p>
          <Divider data-testid="divider" />
          <p>Section 2 content</p>
        </div>
      );

      // Divider should separate content visually but not interfere with screen reader flow
      const divider = screen.getByTestId('divider');
      expect(divider).toHaveAttribute('role', 'presentation');

      // Content before and after should still be accessible
      expect(screen.getByText('Section 1 content')).toBeInTheDocument();
      expect(screen.getByText('Section 2 content')).toBeInTheDocument();
    });
  });
});
