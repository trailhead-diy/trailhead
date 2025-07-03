import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  DropdownDivider,
} from '../../src/components/dropdown';

describe('Dropdown Components', () => {
  describe('Selection and User Interactions', () => {
    it('should handle item selection and close menu', async () => {
      const handleSelect = vi.fn();
      const user = userEvent.setup();

      render(
        <Dropdown>
          <DropdownButton>Select Option</DropdownButton>
          <DropdownMenu>
            <DropdownItem onClick={handleSelect}>Click Me</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      );

      await user.click(screen.getByRole('button'));
      const item = await screen.findByText('Click Me');
      await user.click(item);

      expect(handleSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div>Outside Element</div>
          <Dropdown>
            <DropdownButton>Menu</DropdownButton>
            <DropdownMenu>
              <DropdownItem>Item</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      );

      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(screen.getByText('Outside Element'));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate through items with arrow keys and close with Escape', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown>
          <DropdownButton>Navigate</DropdownButton>
          <DropdownMenu>
            <DropdownItem>Item 1</DropdownItem>
            <DropdownItem>Item 2</DropdownItem>
            <DropdownItem disabled>Item 3 (disabled)</DropdownItem>
            <DropdownItem>Item 4</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      );

      await user.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Item 1')).toHaveAttribute('data-active');

      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Item 2')).toHaveAttribute('data-active');

      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Item 4')).toHaveAttribute('data-active');

      await user.keyboard('{ArrowUp}');
      expect(screen.getByText('Item 2')).toHaveAttribute('data-active');

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should handle ARIA attributes and disabled items correctly', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Dropdown>
          <DropdownButton>Accessible Menu</DropdownButton>
          <DropdownMenu>
            <DropdownItem onClick={handleClick}>Active Item</DropdownItem>
            <DropdownItem disabled onClick={handleClick}>
              Disabled Item
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      const disabledItem = screen.getByText('Disabled Item');
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

      await user.click(disabledItem);
      expect(handleClick).not.toHaveBeenCalled();

      await user.click(screen.getByText('Active Item'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Composition', () => {
    it('should support sections and dividers', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown>
          <DropdownButton>Complex Menu</DropdownButton>
          <DropdownMenu>
            <DropdownSection>
              <DropdownItem>View Profile</DropdownItem>
              <DropdownItem>Edit Profile</DropdownItem>
            </DropdownSection>
            <DropdownDivider />
            <DropdownSection>
              <DropdownItem>Settings</DropdownItem>
              <DropdownItem>Sign Out</DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      );

      await user.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      expect(screen.getByText('View Profile')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      expect(screen.getByRole('menu').querySelectorAll('[role="group"]')).toHaveLength(2);
    });
  });
});
