import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Checkbox, CheckboxGroup, CheckboxField } from '../checkbox';

describe('Checkbox', () => {
  describe('Interactive State Management', () => {
    it('should handle complete toggle workflow with disabled states', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      const { rerender } = render(<Checkbox onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveAttribute('aria-checked', 'false');
      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(checkbox).toHaveAttribute('aria-checked', 'true');

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(checkbox).toHaveAttribute('aria-checked', 'false');

      rerender(<Checkbox disabled onChange={handleChange} />);
      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-disabled', 'true');
    });

    it('should handle controlled vs uncontrolled states', () => {
      const { rerender } = render(<Checkbox checked />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');

      rerender(<Checkbox defaultChecked />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Special States', () => {
    it('should handle indeterminate state with accessibility', () => {
      render(<Checkbox indeterminate aria-label="Select all items" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
      expect(screen.getByLabelText('Select all items')).toBeInTheDocument();
    });
  });

  describe('CheckboxGroup Composition', () => {
    it('should handle multiple checkboxes with form semantics', () => {
      render(
        <CheckboxGroup>
          <CheckboxField>
            <Checkbox value="option1" name="preferences" />
            <label>Email notifications</label>
          </CheckboxField>
          <CheckboxField>
            <Checkbox value="option2" name="preferences" />
            <label>SMS alerts</label>
          </CheckboxField>
        </CheckboxGroup>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(screen.getByText('Email notifications')).toBeInTheDocument();
      expect(screen.getByText('SMS alerts')).toBeInTheDocument();
    });
  });
});
