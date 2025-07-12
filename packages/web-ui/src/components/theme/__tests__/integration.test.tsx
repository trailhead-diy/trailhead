import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { DefaultColorProvider } from '../default-colors';
import { DefaultColorSelector } from '../default-color-selector';
import { Button } from '../../button';
import { Badge } from '../../badge';

// Mock heroicons
vi.mock('@heroicons/react/16/solid', () => ({
  ChevronDownIcon: () => <svg data-testid="chevron-icon" />,
}));

function TestApp({ children }: { children: ReactNode }) {
  return <DefaultColorProvider>{children}</DefaultColorProvider>;
}

describe('Theme Integration Tests', () => {
  it('color selector changes affect Button component defaults', async () => {
    const user = userEvent.setup();

    render(
      <TestApp>
        <DefaultColorSelector />
        <Button data-testid="test-button">Test Button</Button>
      </TestApp>
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

    // Button should now use red color styling
    await waitFor(() => {
      expect(button.className).toContain('text-white');
    });
  });

  it('color selector changes affect Badge component defaults', async () => {
    const user = userEvent.setup();

    render(
      <TestApp>
        <DefaultColorSelector />
        <Badge data-testid="test-badge">Test Badge</Badge>
      </TestApp>
    );

    const badge = screen.getByTestId('test-badge');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Change to green color
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Green')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Green'));

    // Badge should now use green color styling
    await waitFor(() => {
      expect(badge.className).toContain('bg-green-500/15');
    });
  });

  it('multiple components update simultaneously when color changes', async () => {
    const user = userEvent.setup();

    render(
      <TestApp>
        <DefaultColorSelector />
        <Button data-testid="test-button">Button</Button>
        <Badge data-testid="test-badge">Badge</Badge>
      </TestApp>
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
      // Button uses blue styling
      expect(button.className).toContain('text-white');
      // Badge uses blue styling
      expect(badge.className).toContain('bg-blue-500/15');
    });
  });

  it('color prop overrides default color from context', async () => {
    const user = userEvent.setup();

    render(
      <TestApp>
        <DefaultColorSelector />
        <Button data-testid="default-button">Default Button</Button>
        <Button color="red" data-testid="override-button">
          Override Button
        </Button>
      </TestApp>
    );

    const defaultButton = screen.getByTestId('default-button');
    const overrideButton = screen.getByTestId('override-button');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Change default to green
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Green')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Green'));

    await waitFor(() => {
      // Default button should use green (from context)
      expect(defaultButton.className).toContain('[--btn-bg:var(--color-green-600)]');
      // Override button should still use red (from prop)
      expect(overrideButton.className).toContain('[--btn-bg:var(--color-red-600)]');
    });
  });

  it('works with nested provider configurations', async () => {
    const user = userEvent.setup();

    render(
      <DefaultColorProvider colors={{ button: 'purple' }}>
        <Button data-testid="outer-button">Outer Button</Button>
        <DefaultColorProvider>
          <DefaultColorSelector />
          <Button data-testid="inner-button">Inner Button</Button>
        </DefaultColorProvider>
      </DefaultColorProvider>
    );

    const outerButton = screen.getByTestId('outer-button');
    const innerButton = screen.getByTestId('inner-button');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Outer button should use purple (from initial colors)
    expect(outerButton.className).toContain('[--btn-bg:var(--color-purple-500)]');
    // Inner button should use primary (default)
    expect(innerButton.className).toContain('[--btn-bg:var(--color-blue-600)]');

    // Change inner context to orange
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Orange')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Orange'));

    await waitFor(() => {
      // Outer button unchanged
      expect(outerButton.className).toContain('[--btn-bg:var(--color-purple-500)]');
      // Inner button updated to orange
      expect(innerButton.className).toContain('[--btn-bg:var(--color-orange-500)]');
    });
  });

  it('handles component remounting with preserved color state', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <TestApp>
        <DefaultColorSelector />
        <Button data-testid="test-button">Test Button</Button>
      </TestApp>
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
      <TestApp>
        <DefaultColorSelector />
        <Button data-testid="test-button">Test Button</Button>
        <Badge data-testid="test-badge">Test Badge</Badge>
      </TestApp>
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
      <TestApp>
        <DefaultColorSelector />
        <Button data-testid="tracked-button">Tracked</Button>
      </TestApp>
    );

    const button = screen.getByTestId('tracked-button');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Initially should have primary styling
    expect(button.className).toContain('[--btn-bg:var(--color-blue-600)]');

    // Change color
    await user.click(selector);
    await waitFor(() => {
      expect(screen.getByText('Cyan')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Cyan'));

    // Button should now have cyan styling
    await waitFor(() => {
      expect(button.className).toContain('[--btn-bg:var(--color-cyan-300)]');
      expect(button.className).toContain('text-cyan-950');
    });
  });
});

describe('Edge Cases', () => {
  it('handles color selector without DefaultColorProvider gracefully', () => {
    // This should use the fallback context values
    expect(() => {
      render(<DefaultColorSelector />);
    }).not.toThrow();

    expect(screen.getByRole('button')).toHaveTextContent('Default Color: Primary');
  });

  it('maintains accessibility during color changes', async () => {
    const user = userEvent.setup();

    render(
      <TestApp>
        <DefaultColorSelector />
        <Button data-testid="test-button">Accessible Button</Button>
      </TestApp>
    );

    const button = screen.getByTestId('test-button');
    const selector = screen.getByRole('button', { name: /default color/i });

    // Button should remain accessible after color change
    expect(button).toBeVisible();
    expect(button).not.toHaveAttribute('aria-hidden');

    await user.click(selector);
    await user.click(screen.getByText('Red'));

    await waitFor(() => {
      expect(button).toBeVisible();
      expect(button).not.toHaveAttribute('aria-hidden');
    });
  });
});
