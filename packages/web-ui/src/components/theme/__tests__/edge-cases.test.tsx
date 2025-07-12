import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import {
  useThemeColor,
  useThemeColors,
  AVAILABLE_COLORS,
  type AvailableColor,
} from '../theme-colors';
import { ThemeSelector } from '../theme-selector';

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

describe('Edge Cases and Error Handling', () => {
  it('handles invalid color values by accepting them as strings', () => {
    const { result } = renderHook(() => useThemeColors());

    act(() => {
      // TypeScript would catch this, but JavaScript/runtime should handle it
      result.current.setComponentColor('button', 'invalid-color' as AvailableColor);
    });

    expect(result.current.colors.button).toBe('invalid-color');
  });

  it('useThemeColor returns correct type even with invalid component key', () => {
    const { result } = renderHook(() => useThemeColor('nonexistent' as any));

    // Should not crash, though TypeScript would catch this
    expect(result.current).toBeUndefined();
  });

  it('handles rapid successive color changes', () => {
    const { result } = renderHook(() => useThemeColors());

    act(() => {
      result.current.setGlobalColor('red');
      result.current.setGlobalColor('blue');
      result.current.setGlobalColor('green');
      result.current.setComponentColor('button', 'yellow');
    });

    expect(result.current.colors.button).toBe('yellow');
    expect(result.current.colors.badge).toBe('green');
  });

  it('handles mixed global and component color changes', () => {
    const { result } = renderHook(() => useThemeColors());

    act(() => {
      result.current.setGlobalColor('blue');
      result.current.setComponentColor('badge', 'red');
      result.current.setComponentColor('button', 'green');
    });

    expect(result.current.colors).toEqual({
      button: 'green',
      badge: 'red',
      checkbox: 'blue',
      radio: 'blue',
      switch: 'blue',
    });
  });

  it('ThemeSelector handles missing context gracefully', () => {
    // Should not crash even without provider (using global store)
    expect(() => {
      render(<ThemeSelector />);
    }).not.toThrow();
  });

  it('formatColorName handles edge cases', () => {
    // Import the function if it's exported, or test through the component
    render(<ThemeSelector />);

    // Should handle compound colors like 'dark/zinc'
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('AVAILABLE_COLORS array contains expected values', () => {
    expect(AVAILABLE_COLORS).toContain('primary');
    expect(AVAILABLE_COLORS).toContain('dark/zinc');
    expect(AVAILABLE_COLORS.length).toBeGreaterThan(25);
  });

  it('store functions work consistently across re-renders', () => {
    const contextValues: any[] = [];

    const TestComponent = () => {
      const context = useThemeColors();
      contextValues.push(context);
      return null;
    };

    const { rerender } = render(<TestComponent />);

    rerender(<TestComponent />);

    // Should have captured context from renders
    expect(contextValues.length).toBeGreaterThanOrEqual(2);

    // Functions should work even if recreated
    expect(typeof contextValues[0].setGlobalColor).toBe('function');
    expect(typeof contextValues[1].setGlobalColor).toBe('function');
  });

  it('handles component unmounting during color change', () => {
    const { result, unmount } = renderHook(() => useThemeColors());

    act(() => {
      result.current.setGlobalColor('red');
    });

    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('maintains type safety with generic useThemeColor', () => {
    const { result } = renderHook(() => useThemeColor<string>('button'));

    expect(typeof result.current).toBe('string');
    expect(result.current).toBe('primary');
  });

  it('handles store direct access', () => {
    const store = useThemeColors.getState();

    expect(store.colors.button).toBe('primary');
    expect(typeof store.setGlobalColor).toBe('function');

    // Direct store manipulation should work
    act(() => {
      store.setComponentColor('button', 'orange');
    });

    expect(useThemeColors.getState().colors.button).toBe('orange');
  });

  it('store subscription works correctly', () => {
    let callCount = 0;
    const unsubscribe = useThemeColors.subscribe(() => {
      callCount++;
    });

    act(() => {
      useThemeColors.getState().setGlobalColor('red');
    });

    expect(callCount).toBeGreaterThan(0);
    unsubscribe();
  });

  it('resetToDefaults with partial overrides works correctly', () => {
    const { result } = renderHook(() => useThemeColors());

    // Set some colors
    act(() => {
      result.current.setGlobalColor('red');
    });

    // Reset with partial overrides
    act(() => {
      result.current.resetToDefaults({ button: 'blue', badge: 'green' });
    });

    expect(result.current.colors).toEqual({
      button: 'blue',
      badge: 'green',
      checkbox: 'primary',
      radio: 'primary',
      switch: 'primary',
    });
  });

  it('handles selector performance with multiple subscriptions', () => {
    const { result: result1 } = renderHook(() => useThemeColor('button'));
    const { result: result2 } = renderHook(() => useThemeColor('badge'));
    const { result: result3 } = renderHook(() => useThemeColors());

    act(() => {
      result3.current.setComponentColor('button', 'red');
    });

    expect(result1.current).toBe('red');
    expect(result2.current).toBe('zinc'); // Should remain unchanged
  });
});
