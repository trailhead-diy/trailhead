import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Avatar, AvatarButton } from '../../src/components/avatar';

describe('Avatar', () => {
  describe('Image Loading and Fallback', () => {
    it('should display image with alt text for accessibility', () => {
      render(<Avatar src="/avatar.jpg" alt="John Doe's avatar" />);
      const img = screen.getByRole('img', { name: "John Doe's avatar" });
      expect(img).toHaveAttribute('src', '/avatar.jpg');
    });

    it('should show initials as fallback when image fails', () => {
      render(<Avatar src="/invalid.jpg" alt="User" initials="JD" />);
      // Image will be in DOM but initials are also shown as fallback
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });
});

describe('AvatarButton', () => {
  describe('Interactive Behavior', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<AvatarButton onClick={handleClick} initials="AB" aria-label="User profile" />);

      await user.click(screen.getByRole('button', { name: 'User profile' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should prevent clicks when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <AvatarButton disabled onClick={handleClick} initials="AB" aria-label="Disabled user" />
      );

      const button = screen.getByRole('button', { name: 'Disabled user' });
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<AvatarButton onClick={handleClick} initials="AB" aria-label="Navigate to profile" />);

      const button = screen.getByRole('button', { name: 'Navigate to profile' });
      button.focus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
