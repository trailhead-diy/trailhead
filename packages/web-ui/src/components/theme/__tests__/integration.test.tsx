import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useThemeColors } from '../theme-colors';
import { ThemeSelector } from '../theme-selector';
import { Button } from '../../button';
import { Badge } from '../../badge';

// Mock heroicons
vi.mock('@heroicons/react/16/solid', () => ({
  ChevronDownIcon: () => <svg data-testid="chevron-icon" />,
}));

beforeEach(() => {
  // Reset Zustand store state before each test
  useThemeColors.setState({
    colors: {
      button: 'primary',
      badge: 'zinc',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    },
    isLoaded: true,
  });
});

describe('Theme Integration Tests', () => {
  it('theme color selector changes affect Button component styling', async () => {
    const user = userEvent.setup();

    render(
      <>
        <ThemeSelector />
        <Button data-testid="test-button">Test Button</Button>
      </>
    );

    const button = screen.getByTestId('test-button');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Initially should use primary color classes
    expect(button).toHaveClass('before:bg-(--btn-bg)');

    // Change to red color
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Red'));

    // Button should now use red color
    await waitFor(() => {
      expect(button.className).toContain('text-white');
    });
  });

  it('theme color selector changes affect Badge component styling', async () => {
    const user = userEvent.setup();

    render(
      <>
        <ThemeSelector />
        <Badge data-testid="test-badge">Test Badge</Badge>
      </>
    );

    const badge = screen.getByTestId('test-badge');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Change to green color
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Green')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Green'));

    // Badge should now use green color
    await waitFor(() => {
      expect(badge.className).toContain('bg-green-500/15');
    });
  });

  it('multiple components update simultaneously when color changes', async () => {
    const user = userEvent.setup();

    render(
      <>
        <ThemeSelector />
        <Button data-testid="test-button">Button</Button>
        <Badge data-testid="test-badge">Badge</Badge>
      </>
    );

    const button = screen.getByTestId('test-button');
    const badge = screen.getByTestId('test-badge');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Change to blue color
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Blue')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Blue'));

    // Both components should update
    await waitFor(() => {
      expect(button.className).toContain('[--btn-bg:var(--color-blue-600)]');
      expect(badge.className).toContain('bg-blue-500/15');
    });
  });

  it('color prop overrides theme color from context', async () => {
    const user = userEvent.setup();

    render(
      <>
        <ThemeSelector />
        <Button data-testid="theme-button">Theme Button</Button>
        <Button color="red" data-testid="override-button">
          Override Button
        </Button>
      </>
    );

    const themeButton = screen.getByTestId('theme-button');
    const overrideButton = screen.getByTestId('override-button');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Change theme to green
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Green')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Green'));

    await waitFor(() => {
      // Theme button should use green
      expect(themeButton.className).toContain('[--btn-bg:var(--color-green-600)]');
      // Override button should still use red
      expect(overrideButton.className).toContain('[--btn-bg:var(--color-red-600)]');
    });
  });

  it('nested components inherit theme colors correctly', async () => {
    const user = userEvent.setup();

    const NestedComponent = () => (
      <div>
        <Button data-testid="nested-button">Nested Button</Button>
      </div>
    );

    render(
      <>
        <ThemeSelector />
        <NestedComponent />
      </>
    );

    const selector = screen.getByRole('button', { name: /default color/i });
    const nestedButton = screen.getByTestId('nested-button');

    // Change to orange
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Orange')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Orange'));

    // Nested component should use orange
    await waitFor(() => {
      expect(nestedButton.className).toContain('[--btn-bg:var(--color-orange-500)]');
    });
  });

  it('handles component remounting with preserved color state', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <>
        <ThemeSelector />
        <Button data-testid="test-button">Test Button</Button>
      </>
    );

    const selector = screen.getByRole('button', { name: /default color/i });

    // Change color
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Teal')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Teal'));

    // Remount components
    rerender(
      <>
        <ThemeSelector />
        <Button data-testid="test-button">Test Button</Button>
        <Badge data-testid="test-badge">Test Badge</Badge>
      </>
    );

    // Components should still use teal color
    await waitFor(() => {
      const button = screen.getByTestId('test-button');
      const badge = screen.getByTestId('test-badge');

      expect(button.className).toContain('[--btn-bg:var(--color-teal-600)]');
      expect(badge.className).toContain('bg-teal-500/15');
      expect(screen.getByRole('button', { name: /default color/i })).toHaveTextContent('Teal');
    });
  });

  it('performance: color changes are applied to button styling', async () => {
    const user = userEvent.setup();

    render(
      <>
        <ThemeSelector />
        <Button data-testid="tracked-button">Tracked</Button>
      </>
    );

    const button = screen.getByTestId('tracked-button');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Initially should have primary styling
    expect(button.className).toContain('[--btn-bg:var(--color-blue-600)]');

    // Change color multiple times quickly
    await user.click(selector);
    await user.click(screen.getByText('Red'));

    await user.click(selector);
    await user.click(screen.getByText('Purple'));

    await user.click(selector);
    await user.click(screen.getByText('Green'));

    // Final state should be green
    await waitFor(() => {
      expect(button.className).toContain('[--btn-bg:var(--color-green-600)]');
    });
  });

  it('resets colors correctly across all components', async () => {
    const user = userEvent.setup();

    render(
      <>
        <ThemeSelector />
        <Button data-testid="test-button">Button</Button>
        <Badge data-testid="test-badge">Badge</Badge>
      </>
    );

    const selector = screen.getByRole('button', { name: /default color/i });

    // Change color first
    await user.click(selector);
    await user.click(screen.getByText('Purple'));

    // Then reset via store
    useThemeColors.getState().resetToDefaults();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /default color/i })).toHaveTextContent(
        'Default Color: Primary'
      );
    });
  });

  it('maintains accessibility during color changes', async () => {
    const user = userEvent.setup();

    render(
      <>
        <ThemeSelector />
        <Button data-testid="test-button">Accessible Button</Button>
      </>
    );

    const button = screen.getByTestId('test-button');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Button should remain accessible after color change
    expect(button).toBeVisible();
    expect(button).not.toHaveAttribute('aria-hidden');

    await user.click(selector);
    await user.click(screen.getByText('Yellow'));

    // Still accessible after color change
    expect(button).toBeVisible();
    expect(button).not.toHaveAttribute('aria-hidden');
    expect(button).toHaveTextContent('Accessible Button');
  });
});
