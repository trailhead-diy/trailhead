'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Theme color configuration for all components
 */
export interface ThemeColors {
  button: string;
  badge: string;
  checkbox: string;
  radio: string;
  switch: string;
}

/**
 * Available colors for selection
 */
export const AVAILABLE_COLORS = [
  // Semantic colors
  'primary',
  'secondary',
  'destructive',
  'accent',
  'muted',
  // Basic colors
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  // Zinc variations
  'zinc',
  'dark',
  'light',
  'white',
  'dark/zinc',
  'dark/white',
] as const;

export type AvailableColor = (typeof AVAILABLE_COLORS)[number];

/**
 * Built-in default colors for components
 */
const builtinDefaults: ThemeColors = {
  button: 'primary',
  badge: 'zinc',
  checkbox: 'primary',
  radio: 'primary',
  switch: 'primary',
};

/**
 * Zustand store for theme color management with persistence
 */
interface ThemeColorStore {
  colors: ThemeColors;
  isLoaded: boolean;
  setGlobalColor: (color: AvailableColor) => void;
  setComponentColor: (component: keyof ThemeColors, color: AvailableColor) => void;
  resetToDefaults: (customDefaults?: Partial<ThemeColors>) => void;
}

/**
 * Theme color store with localStorage persistence and SSR safety
 *
 * Features:
 * - Automatic persistence to localStorage
 * - SSR-safe with hydration handling
 * - Zero flash of unstyled content (FOUC)
 * - TypeScript-safe color management
 * - Optimized selectors to prevent unnecessary re-renders
 */
export const useThemeColors = create<ThemeColorStore>()(
  persist(
    set => ({
      colors: builtinDefaults,
      isLoaded: false,

      setGlobalColor: color =>
        set({
          colors: {
            button: color,
            badge: color,
            checkbox: color,
            radio: color,
            switch: color,
          },
        }),

      setComponentColor: (component, color) =>
        set(state => ({
          colors: {
            ...state.colors,
            [component]: color,
          },
        })),

      resetToDefaults: (customDefaults = {}) =>
        set({
          colors: { ...builtinDefaults, ...customDefaults },
        }),
    }),
    {
      name: 'trailhead-ui-theme-colors',
      version: 1,
      skipHydration: true,
      onRehydrateStorage: () => state => {
        if (state) {
          state.isLoaded = true;
        }
      },
      partialize: state => ({
        colors: state.colors,
      }),
    }
  )
);

/**
 * Hook to get the theme color for a specific component
 * Uses optimized selector to prevent unnecessary re-renders
 *
 * @param component - The component type to get default color for
 * @returns The default color string for the component
 *
 * @example
 * ```tsx
 * function MyButton({ color, ...props }) {
 *   const defaultColor = useThemeColor('button');
 *   const finalColor = color ?? defaultColor;
 *   return <button className={getColorStyles(finalColor)} {...props} />;
 * }
 * ```
 */
export function useThemeColor<T>(component: keyof ThemeColors): T {
  return useThemeColors(state => state.colors[component] as T);
}

// Initialize store loading state
if (typeof window !== 'undefined') {
  // Mark as loaded for client-side rendering
  useThemeColors.setState({ isLoaded: true });
}
