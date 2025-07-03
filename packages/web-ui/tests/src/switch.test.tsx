import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Switch } from '../../src/components/switch';

describe('Switch', () => {
  describe('Toggle Functionality', () => {
    it('should toggle switch state on click', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should call onChange handler when toggled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch onChange={handleChange} />);

      await user.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalled();
    });

    it('should respect controlled checked state', () => {
      render(<Switch checked />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('should respect defaultChecked state', () => {
      render(<Switch defaultChecked />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should prevent interaction when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch disabled onChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-disabled', '');

      await user.click(switchElement);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
