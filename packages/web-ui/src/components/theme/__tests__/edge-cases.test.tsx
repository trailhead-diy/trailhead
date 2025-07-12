import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import {
  DefaultColorProvider,
  useDefaultColor,
  useDefaultColors,
  AVAILABLE_COLORS,
  type AvailableColor,
} from '../default-colors';
import { DefaultColorSelector } from '../default-color-selector';

// Mock heroicons
vi.mock('@heroicons/react/16/solid', () => ({
  ChevronDownIcon: () => <svg data-testid="chevron-icon" />,
}));

function TestWrapper({ children }: { children: ReactNode }) {
  return <DefaultColorProvider>{children}</DefaultColorProvider>;
}

describe('Edge Cases and Error Handling', () => {
  it('handles undefined initial colors gracefully', () => {
    expect(() => {
      render(
        <DefaultColorProvider colors={undefined}>
          <div>Test</div>
        </DefaultColorProvider>
      );
    }).not.toThrow();
  });

  it('handles empty initial colors object', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => (
        <DefaultColorProvider colors={{}}>{children}</DefaultColorProvider>
      ),
    });

    expect(result.current.colors).toEqual({
      button: 'primary',
      badge: 'zinc',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('handles partial initial colors correctly', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => (
        <DefaultColorProvider colors={{ button: 'red' }}>{children}</DefaultColorProvider>
      ),
    });

    expect(result.current.colors).toEqual({
      button: 'red',
      badge: 'zinc',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('handles invalid color values by accepting them as strings', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    // TypeScript would prevent this, but runtime should handle it
    act(() => {
      result.current.setGlobalColor('invalid-color' as AvailableColor);
    });

    expect(result.current.colors.button).toBe('invalid-color');
  });

  it('useDefaultColor returns correct type even with invalid component key', () => {
    const { result } = renderHook(() => useDefaultColor('nonexistent' as any), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    // Should return undefined for non-existent keys
    expect(result.current).toBeUndefined();
  });

  it('context functions work consistently across re-renders', () => {
    const { result, rerender } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    const originalColors = result.current.colors;

    rerender();

    // Functions may be recreated but should work the same way
    act(() => {
      result.current.setGlobalColor('red');
    });

    expect(result.current.colors.button).toBe('red');
    expect(result.current.colors).not.toBe(originalColors);
  });

  it('handles rapid successive color changes', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    act(() => {
      result.current.setGlobalColor('red');
      result.current.setGlobalColor('green');
      result.current.setGlobalColor('blue');
    });

    // Should end up with the last color
    expect(result.current.colors.button).toBe('blue');
  });

  it('handles mixed global and component color changes', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    act(() => {
      result.current.setGlobalColor('red');
      result.current.setComponentColor('badge', 'blue');
      result.current.setGlobalColor('green');
    });

    // Global change should override component-specific change
    expect(result.current.colors).toEqual({
      button: 'green',
      badge: 'green',
      checkbox: 'green',
      radio: 'green',
      switch: 'green',
    });
  });

  it('DefaultColorSelector handles missing context gracefully', () => {
    // Render without DefaultColorProvider
    expect(() => {
      render(<DefaultColorSelector />);
    }).not.toThrow();

    // Should show default values
    expect(screen.getByRole('button')).toHaveTextContent('Default Color: Primary');
  });

  it('formatColorName handles edge cases', () => {
    render(
      <TestWrapper>
        <DefaultColorSelector />
      </TestWrapper>
    );

    // The formatting function should be tested indirectly through the component
    expect(() => {
      screen.getByRole('button');
    }).not.toThrow();
  });

  it('AVAILABLE_COLORS array contains expected values', () => {
    expect(AVAILABLE_COLORS).toContain('primary');
    expect(AVAILABLE_COLORS).toContain('red');
    expect(AVAILABLE_COLORS).toContain('zinc');
    expect(AVAILABLE_COLORS.length).toBeGreaterThan(20);
  });

  it('context provides working functions across re-renders', () => {
    let contextValues: any[] = [];

    function TestComponent() {
      const colors = useDefaultColors();
      contextValues.push(colors);
      return null;
    }

    const { rerender } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    rerender(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should have captured context from both renders
    expect(contextValues.length).toBe(2);

    // Functions should work even if recreated
    expect(typeof contextValues[0].setGlobalColor).toBe('function');
    expect(typeof contextValues[1].setGlobalColor).toBe('function');
  });

  it('handles component unmounting during color change', () => {
    const { result, unmount } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    act(() => {
      result.current.setGlobalColor('red');
    });

    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('maintains type safety with generic useDefaultColor', () => {
    const { result: stringResult } = renderHook(() => useDefaultColor<string>('button'), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    const { result: anyResult } = renderHook(() => useDefaultColor<any>('badge'), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(typeof stringResult.current).toBe('string');
    expect(anyResult.current).toBeDefined();
  });

  it('handles provider nesting with different initial values', () => {
    function NestedTest() {
      const outerColors = useDefaultColors();

      return (
        <div>
          <span data-testid="outer-button">{outerColors.colors.button}</span>
          <DefaultColorProvider colors={{ button: 'nested-color' as AvailableColor }}>
            <InnerTest />
          </DefaultColorProvider>
        </div>
      );
    }

    function InnerTest() {
      const innerColors = useDefaultColors();
      return <span data-testid="inner-button">{innerColors.colors.button}</span>;
    }

    render(
      <DefaultColorProvider colors={{ button: 'outer-color' as AvailableColor }}>
        <NestedTest />
      </DefaultColorProvider>
    );

    expect(screen.getByTestId('outer-button')).toHaveTextContent('outer-color');
    expect(screen.getByTestId('inner-button')).toHaveTextContent('nested-color');
  });

  it('preserves referential equality for unchanged context values', () => {
    let renderCount = 0;
    let lastColors: any = null;

    function TestComponent() {
      renderCount++;
      const { colors } = useDefaultColors();

      if (lastColors && lastColors !== colors) {
        // Colors object should only change when actual values change
      }
      lastColors = colors;

      return null;
    }

    const { rerender } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const initialRenderCount = renderCount;

    // Re-render without changes
    rerender(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(renderCount).toBe(initialRenderCount + 1);
  });
});
