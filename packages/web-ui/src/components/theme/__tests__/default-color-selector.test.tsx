import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { DefaultColorProvider, useDefaultColors } from '../default-colors';
import { DefaultColorSelector } from '../default-color-selector';

// Mock heroicons to avoid import issues in tests
vi.mock('@heroicons/react/16/solid', () => ({
  ChevronDownIcon: () => <svg data-testid="chevron-icon" />,
}));

function TestWrapper({ children }: { children: ReactNode }) {
  return <DefaultColorProvider>{children}</DefaultColorProvider>;
}

// Test component to verify color changes
function ColorDisplay() {
  const { colors } = useDefaultColors();
  return (
    <div>
      <span data-testid="current-button-color">{colors.button}</span>
      <span data-testid="current-badge-color">{colors.badge}</span>
    </div>
  );
}

describe('DefaultColorSelector', () => {
  it('renders with default label and current color', () => {
    render(
      <TestWrapper>
        <DefaultColorSelector />
      </TestWrapper>
    );

    expect(screen.getByRole('button')).toHaveTextContent('Default Color: Primary');
    expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();

    // Should have a color preview circle
    const button = screen.getByRole('button');
    const colorCircle = button.querySelector('.size-3.rounded-full');
    expect(colorCircle).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(
      <TestWrapper>
        <DefaultColorSelector label="Theme Color" />
      </TestWrapper>
    );

    expect(screen.getByRole('button')).toHaveTextContent('Theme Color: Primary');
  });

  it('shows dropdown menu when clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DefaultColorSelector />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Check that some color options are visible
    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument();
      expect(screen.getByText('Green')).toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
    });
  });

  it('changes global color when option is selected', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DefaultColorSelector />
        <ColorDisplay />
      </TestWrapper>
    );

    // Verify initial state
    expect(screen.getByTestId('current-button-color')).toHaveTextContent('primary');

    // Open dropdown and select red
    const button = screen.getByRole('button', { name: /default color/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Red'));

    // Verify color changed
    await waitFor(() => {
      expect(screen.getByTestId('current-button-color')).toHaveTextContent('red');
      expect(screen.getByTestId('current-badge-color')).toHaveTextContent('red');
    });

    // Verify button label updated
    expect(screen.getByRole('button')).toHaveTextContent('Default Color: Red');
  });

  it('formats color names correctly', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DefaultColorSelector />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      // Test basic color formatting
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();

      // Test compound color formatting
      expect(screen.getByText('Dark / Zinc')).toBeInTheDocument();
      expect(screen.getByText('Dark / White')).toBeInTheDocument();
    });
  });

  it('displays all available colors in dropdown with color circles', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DefaultColorSelector />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Wait for menu to open and check a representative sample
    await waitFor(() => {
      const semanticColors = ['Primary', 'Secondary', 'Destructive'];
      const basicColors = ['Red', 'Green', 'Blue'];
      const specialColors = ['Zinc', 'Dark', 'Light'];

      [...semanticColors, ...basicColors, ...specialColors].forEach(color => {
        expect(screen.getByText(color)).toBeInTheDocument();
      });

      // Should have color preview circles for each option
      const colorCircles = document.querySelectorAll('.size-3.rounded-full');
      expect(colorCircles.length).toBeGreaterThan(20); // At least one per color + button
    });
  });

  it('applies custom className when provided', () => {
    render(
      <TestWrapper>
        <DefaultColorSelector className="custom-class" />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('shows color preview circles with appropriate styling', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DefaultColorSelector />
      </TestWrapper>
    );

    const button = screen.getByRole('button');

    // Button should have a color circle for current color (primary -> blue)
    const buttonCircle = button.querySelector('.size-3.rounded-full');
    expect(buttonCircle).toHaveClass('bg-blue-600');

    // Open dropdown and check some specific color circles
    await user.click(button);

    await waitFor(() => {
      const redOption = screen.getByText('Red').parentElement;
      const redCircle = redOption?.querySelector('.size-3.rounded-full');
      expect(redCircle).toHaveClass('bg-red-500');

      const whiteOption = screen.getByText('White').parentElement;
      const whiteCircle = whiteOption?.querySelector('.size-3.rounded-full');
      expect(whiteCircle).toHaveClass('bg-white');
      expect(whiteCircle).toHaveClass('border-zinc-300');
    });
  });

  it('handles rapid color changes correctly', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DefaultColorSelector />
        <ColorDisplay />
      </TestWrapper>
    );

    const button = screen.getByRole('button');

    // Rapidly change colors
    await user.click(button);
    await user.click(screen.getByText('Red'));

    await user.click(button);
    await user.click(screen.getByText('Green'));

    await user.click(button);
    await user.click(screen.getByText('Blue'));

    // Final state should be blue
    await waitFor(() => {
      expect(screen.getByTestId('current-button-color')).toHaveTextContent('blue');
      expect(screen.getByRole('button')).toHaveTextContent('Default Color: Blue');
    });
  });

  it('maintains color selection across re-renders', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <TestWrapper>
        <DefaultColorSelector />
        <ColorDisplay />
      </TestWrapper>
    );

    // Change color
    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(screen.getByText('Purple'));

    await waitFor(() => {
      expect(screen.getByTestId('current-button-color')).toHaveTextContent('purple');
    });

    // Re-render and verify color persists
    rerender(
      <TestWrapper>
        <DefaultColorSelector />
        <ColorDisplay />
      </TestWrapper>
    );

    expect(screen.getByTestId('current-button-color')).toHaveTextContent('purple');
    expect(screen.getByRole('button')).toHaveTextContent('Default Color: Purple');
  });
});

describe('DefaultColorSelector integration', () => {
  it('works with multiple selectors sharing same context', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DefaultColorSelector label="Selector 1" />
        <DefaultColorSelector label="Selector 2" />
        <ColorDisplay />
      </TestWrapper>
    );

    // Both selectors should show same initial color
    expect(screen.getByRole('button', { name: /selector 1/i })).toHaveTextContent('Primary');
    expect(screen.getByRole('button', { name: /selector 2/i })).toHaveTextContent('Primary');

    // Change color via first selector
    const selector1 = screen.getByRole('button', { name: /selector 1/i });
    await user.click(selector1);
    await user.click(screen.getByText('Orange'));

    // Both selectors should update
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /selector 1/i })).toHaveTextContent('Orange');
      expect(screen.getByRole('button', { name: /selector 2/i })).toHaveTextContent('Orange');
      expect(screen.getByTestId('current-button-color')).toHaveTextContent('orange');
    });
  });
});
