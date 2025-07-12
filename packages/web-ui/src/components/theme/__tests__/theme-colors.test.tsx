import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { useThemeColor, useThemeColors, AVAILABLE_COLORS } from '../theme-colors';

// Mock localStorage for testing
const mockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const originalLocalStorage = global.localStorage;
const mockStorage = mockLocalStorage();

beforeEach(() => {
  Object.defineProperty(global, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  mockStorage.clear();
  // Reset Zustand store state
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

afterEach(() => {
  Object.defineProperty(global, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
  });
});

describe('useThemeColors hook', () => {
  it('provides built-in theme colors initially', () => {
    const { result } = renderHook(() => useThemeColors());

    expect(result.current.colors).toEqual({
      button: 'primary',
      badge: 'zinc',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('updates all component colors when setGlobalColor is called', () => {
    const { result } = renderHook(() => useThemeColors());

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
    const { result } = renderHook(() => useThemeColors());

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
    const { result } = renderHook(() => useThemeColors());

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

  it('resets colors to theme defaults when resetToDefaults is called', () => {
    const { result } = renderHook(() => useThemeColors());

    // Change colors first
    act(() => {
      result.current.setGlobalColor('red');
    });

    // Reset to theme defaults
    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.colors).toEqual({
      button: 'primary',
      badge: 'zinc',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('resets colors with custom theme defaults', () => {
    const { result } = renderHook(() => useThemeColors());

    const customThemeDefaults = { button: 'green', badge: 'blue' };

    act(() => {
      result.current.resetToDefaults(customThemeDefaults);
    });

    expect(result.current.colors).toEqual({
      button: 'green',
      badge: 'blue',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('provides isLoaded state', () => {
    const { result } = renderHook(() => useThemeColors());
    expect(result.current.isLoaded).toBe(true);
  });
});

describe('useThemeColor hook', () => {
  it('returns correct theme color for specific component', () => {
    const { result } = renderHook(() => useThemeColor('button'));
    expect(result.current).toBe('primary');
  });

  it('returns updated color after store change', () => {
    const TestComponent = () => {
      const colors = useThemeColors();
      const buttonColor = useThemeColor('button');

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

    const { getByTestId } = render(<TestComponent />);

    expect(getByTestId('button-color')).toHaveTextContent('primary');

    act(() => {
      getByTestId('change-color').click();
    });

    expect(getByTestId('button-color')).toHaveTextContent('red');
  });

  it('works with TypeScript generic for type safety', () => {
    const { result } = renderHook(() => useThemeColor<string>('badge'));

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

describe('Zustand store functionality', () => {
  it('maintains state correctly when colors change', () => {
    const { result } = renderHook(() => useThemeColors());

    act(() => {
      result.current.setGlobalColor('red');
    });

    expect(result.current.colors).toEqual({
      button: 'red',
      badge: 'red',
      checkbox: 'red',
      radio: 'red',
      switch: 'red',
    });
  });

  it('store has persistence configured', () => {
    // Verify the store has persist methods available
    expect(useThemeColors.persist).toBeDefined();
    expect(typeof useThemeColors.persist.rehydrate).toBe('function');
    expect(typeof useThemeColors.persist.hasHydrated).toBe('function');
  });

  it('handles localStorage errors gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('Storage error');
        },
        setItem: () => {
          throw new Error('Storage error');
        },
        removeItem: () => {
          throw new Error('Storage error');
        },
      },
      writable: true,
    });

    const { result } = renderHook(() => useThemeColors());

    // Should use built-in theme defaults when localStorage fails
    expect(result.current.colors).toEqual({
      button: 'primary',
      badge: 'zinc',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });

    consoleWarnSpy.mockRestore();
  });
});

describe('Store integration', () => {
  it('multiple useThemeColor hooks share same store', () => {
    const TestComponent = () => {
      const buttonColor = useThemeColor('button');
      const badgeColor = useThemeColor('badge');
      const { setGlobalColor } = useThemeColors();

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

    const { getByTestId } = render(<TestComponent />);

    expect(getByTestId('button-color')).toHaveTextContent('primary');
    expect(getByTestId('badge-color')).toHaveTextContent('zinc');

    act(() => {
      getByTestId('change-color').click();
    });

    expect(getByTestId('button-color')).toHaveTextContent('purple');
    expect(getByTestId('badge-color')).toHaveTextContent('purple');
  });

  it('store updates work across multiple components', () => {
    const store = useThemeColors.getState();

    // Direct store update
    act(() => {
      store.setComponentColor('button', 'orange');
    });

    const { result } = renderHook(() => useThemeColors());
    expect(result.current.colors.button).toBe('orange');
  });
});

// Note: SSR safety is handled by Zustand's skipHydration option
// The store correctly handles server-side rendering without localStorage
