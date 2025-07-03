import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Divider } from '../../src/components/divider';

describe('Divider Component', () => {
  describe('HTML Semantic Behavior', () => {
    it('should render as an hr element with proper semantics', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider.tagName).toBe('HR');
      expect(divider).toHaveAttribute('role', 'presentation');
    });

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

  describe('Visual Styling Behavior', () => {
    it('should apply default hard border styling', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('w-full');
      expect(divider).toHaveClass('border-t');
      expect(divider).toHaveClass('border-zinc-950/10');
      expect(divider).toHaveClass('dark:border-border');
    });

    it('should apply soft border styling when soft prop is true', () => {
      render(<Divider soft data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('w-full');
      expect(divider).toHaveClass('border-t');
      expect(divider).toHaveClass('border-zinc-950/5');
      expect(divider).toHaveClass('dark:border-border');
    });

    it('should support custom className styling', () => {
      render(<Divider className="my-custom-class border-red-500" data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('my-custom-class');
      expect(divider).toHaveClass('border-red-500');
      // Should still have base classes
      expect(divider).toHaveClass('w-full');
      expect(divider).toHaveClass('border-t');
    });

    it('should override default styling with custom className when needed', () => {
      // Test that custom styles can override defaults due to cn() utility
      render(<Divider className="border-b border-red-500" data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('border-b'); // Custom border direction
      expect(divider).toHaveClass('border-red-500'); // Custom color
      expect(divider).toHaveClass('w-full'); // Base class preserved
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have presentation role for screen readers', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveAttribute('role', 'presentation');
    });

    it('should not interfere with keyboard navigation', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      // Hr elements should not be focusable by default
      expect(divider).not.toHaveAttribute('tabindex');
    });

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

  describe('Theme Integration', () => {
    it('should use semantic border tokens for dark mode compatibility', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      // Should use dark:border-border which is a semantic token
      expect(divider).toHaveClass('dark:border-border');
    });

    it('should provide different opacity levels for soft vs hard borders', () => {
      const { rerender } = render(<Divider data-testid="divider" />);

      let divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('border-zinc-950/10'); // Hard border - higher opacity

      rerender(<Divider soft data-testid="divider" />);
      divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('border-zinc-950/5'); // Soft border - lower opacity
    });
  });

  describe('User Experience Scenarios', () => {
    it('should provide visual separation between content sections', () => {
      render(
        <div data-testid="content-with-divider">
          <div>Content above</div>
          <Divider />
          <div>Content below</div>
        </div>
      );

      const container = screen.getByTestId('content-with-divider');
      const hr = container.querySelector('hr');

      expect(hr).toBeInTheDocument();
      expect(hr).toHaveClass('w-full', 'border-t');
    });

    it('should support layout use cases with soft dividers for subtle separation', () => {
      render(
        <div data-testid="layout-with-soft-dividers">
          <nav>Navigation</nav>
          <Divider soft />
          <main>Main content</main>
          <Divider soft />
          <footer>Footer</footer>
        </div>
      );

      const container = screen.getByTestId('layout-with-soft-dividers');
      const dividers = container.querySelectorAll('hr');

      expect(dividers).toHaveLength(2);
      dividers.forEach(divider => {
        expect(divider).toHaveClass('border-zinc-950/5'); // Soft border
      });
    });

    it('should support hard dividers for prominent section breaks', () => {
      render(
        <article data-testid="article-with-dividers">
          <section>Introduction</section>
          <Divider />
          <section>Main content</section>
          <Divider />
          <section>Conclusion</section>
        </article>
      );

      const container = screen.getByTestId('article-with-dividers');
      const dividers = container.querySelectorAll('hr');

      expect(dividers).toHaveLength(2);
      dividers.forEach(divider => {
        expect(divider).toHaveClass('border-zinc-950/10'); // Hard border
        expect(divider).toHaveAttribute('role', 'presentation');
      });
    });
  });

  describe('Component Integration', () => {
    it('should work correctly with wrapper component props', () => {
      render(<Divider className="custom-class" soft data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      // Props should be passed through correctly
      expect(divider).toHaveClass('custom-class');
      expect(divider).toHaveClass('border-zinc-950/5'); // soft prop applied
    });

    it('should forward ref correctly for advanced use cases', () => {
      let dividerRef: HTMLHRElement | null = null;

      render(
        <Divider
          ref={ref => {
            dividerRef = ref;
          }}
          data-testid="divider"
        />
      );

      const divider = screen.getByTestId('divider');
      expect(dividerRef).toBe(divider);
      expect(dividerRef?.tagName).toBe('HR');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty className gracefully', () => {
      render(<Divider className="" data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('w-full', 'border-t');
    });

    it('should handle undefined className gracefully', () => {
      render(<Divider className={undefined} data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('w-full', 'border-t');
    });

    it('should work without any props', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toBeInTheDocument();
      expect(divider).toHaveClass('w-full', 'border-t');
      expect(divider).toHaveAttribute('role', 'presentation');
    });
  });
});
