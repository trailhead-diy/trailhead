import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  describe('Variant Props', () => {
    it('should handle color variants', () => {
      render(
        <div>
          <Button color="blue">Blue Button</Button>
          <Button color="red">Red Button</Button>
        </div>
      );

      expect(screen.getByText('Blue Button')).toBeInTheDocument();
      expect(screen.getByText('Red Button')).toBeInTheDocument();
    });

    it('should handle boolean variants', () => {
      render(
        <div>
          <Button outline>Outline Button</Button>
          <Button plain>Plain Button</Button>
          <Button disabled>Disabled Button</Button>
        </div>
      );

      expect(screen.getByText('Outline Button')).toBeInTheDocument();
      expect(screen.getByText('Plain Button')).toBeInTheDocument();
      expect(screen.getByText('Disabled Button')).toBeDisabled();
    });
  });

  describe('Click Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Link Behavior', () => {
    it('should render as link when href is provided', () => {
      render(<Button href="/test">Link Button</Button>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/test');
    });
  });
});
