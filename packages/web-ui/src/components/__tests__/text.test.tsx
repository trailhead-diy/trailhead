import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TextLink } from '../text';

describe('TextLink', () => {
  describe('Link Navigation', () => {
    it('should render as a navigable link with href', () => {
      render(<TextLink href="/page">Link to page</TextLink>);
      const link = screen.getByRole('link', { name: 'Link to page' });
      expect(link).toHaveAttribute('href', '/page');
    });

    it('should support external links with proper attributes', () => {
      render(
        <TextLink href="https://example.com" target="_blank" rel="noopener noreferrer">
          External link
        </TextLink>
      );
      const link = screen.getByRole('link', { name: 'External link' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
