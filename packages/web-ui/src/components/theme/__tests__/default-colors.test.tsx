import { describe, it, expect } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import {
  DefaultColorProvider,
  useDefaultColor,
  useDefaultColors,
  AVAILABLE_COLORS,
  type DefaultColors,
} from '../default-colors';

// Test wrapper component
function TestWrapper({
  children,
  initialColors = {},
}: {
  children: ReactNode;
  initialColors?: Partial<DefaultColors>;
}) {
  return <DefaultColorProvider colors={initialColors}>{children}</DefaultColorProvider>;
}

describe('DefaultColorProvider', () => {
  it('provides built-in default colors when no overrides specified', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current.colors).toEqual({
      button: 'primary',
      badge: 'zinc',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('merges initial colors with built-in defaults', () => {
    const initialColors = { button: 'red', badge: 'blue' };
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => (
        <TestWrapper initialColors={initialColors}>{children}</TestWrapper>
      ),
    });

    expect(result.current.colors).toEqual({
      button: 'red',
      badge: 'blue',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('updates all component colors when setGlobalColor is called', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    act(() => {
      result.current.setGlobalColor('green');
    });

    expect(result.current.colors).toEqual({
      button: 'green',
      badge: 'green',
      checkbox: 'green',
      radio: 'green',
      switch: 'green',
    });
  });

  it('updates individual component color when setComponentColor is called', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    act(() => {
      result.current.setComponentColor('button', 'red');
    });

    expect(result.current.colors).toEqual({
      button: 'red',
      badge: 'zinc',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('preserves other colors when updating individual component', () => {
    const { result } = renderHook(() => useDefaultColors(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    // Set initial global color
    act(() => {
      result.current.setGlobalColor('blue');
    });

    // Update individual component
    act(() => {
      result.current.setComponentColor('badge', 'yellow');
    });

    expect(result.current.colors).toEqual({
      button: 'blue',
      badge: 'yellow',
      checkbox: 'blue',
      radio: 'blue',
      switch: 'blue',
    });
  });
});

describe('useDefaultColor hook', () => {
  it('returns correct default color for specific component', () => {
    const { result } = renderHook(() => useDefaultColor('button'), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(result.current).toBe('primary');
  });

  it('returns updated color after context change', () => {
    const TestComponent = () => {
      const colors = useDefaultColors();
      const buttonColor = useDefaultColor('button');

      return (
        <div>
          <span data-testid="button-color">{buttonColor as string}</span>
          <button
            data-testid="change-color"
            onClick={() => colors.setComponentColor('button', 'red')}
          >
            Change Color
          </button>
        </div>
      );
    };

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(getByTestId('button-color')).toHaveTextContent('primary');

    act(() => {
      getByTestId('change-color').click();
    });

    expect(getByTestId('button-color')).toHaveTextContent('red');
  });

  it('works with TypeScript generic for type safety', () => {
    const { result } = renderHook(() => useDefaultColor<string>('badge'), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    expect(typeof result.current).toBe('string');
    expect(result.current).toBe('zinc');
  });
});

describe('AVAILABLE_COLORS constant', () => {
  it('contains expected semantic colors', () => {
    const semanticColors = ['primary', 'secondary', 'destructive', 'accent', 'muted'];
    semanticColors.forEach(color => {
      expect(AVAILABLE_COLORS).toContain(color);
    });
  });

  it('contains expected basic colors', () => {
    const basicColors = ['red', 'green', 'blue', 'yellow', 'purple'];
    basicColors.forEach(color => {
      expect(AVAILABLE_COLORS).toContain(color);
    });
  });

  it('contains zinc variations', () => {
    const zincColors = ['zinc', 'dark', 'light', 'white', 'dark/zinc', 'dark/white'];
    zincColors.forEach(color => {
      expect(AVAILABLE_COLORS).toContain(color);
    });
  });

  it('has reasonable length for UI selection', () => {
    expect(AVAILABLE_COLORS.length).toBeGreaterThan(20);
    expect(AVAILABLE_COLORS.length).toBeLessThan(50);
  });
});

describe('Context integration', () => {
  it('multiple useDefaultColor hooks share same context', () => {
    const TestComponent = () => {
      const buttonColor = useDefaultColor('button');
      const badgeColor = useDefaultColor('badge');
      const { setGlobalColor } = useDefaultColors();

      return (
        <div>
          <span data-testid="button-color">{buttonColor as string}</span>
          <span data-testid="badge-color">{badgeColor as string}</span>
          <button data-testid="change-color" onClick={() => setGlobalColor('purple')}>
            Change Color
          </button>
        </div>
      );
    };

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(getByTestId('button-color')).toHaveTextContent('primary');
    expect(getByTestId('badge-color')).toHaveTextContent('zinc');

    act(() => {
      getByTestId('change-color').click();
    });

    expect(getByTestId('button-color')).toHaveTextContent('purple');
    expect(getByTestId('badge-color')).toHaveTextContent('purple');
  });
});
