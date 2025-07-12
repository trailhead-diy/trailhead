'use client';

import { useState, createContext, useContext, type ReactNode } from 'react';

/**
 * Default color configuration for all components
 */
export interface DefaultColors {
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
const builtinDefaults: DefaultColors = {
  button: 'primary',
  badge: 'zinc',
  checkbox: 'primary',
  radio: 'primary',
  switch: 'primary',
};

/**
 * Context value for default color management
 */
interface DefaultColorContextValue {
  colors: DefaultColors;
  setGlobalColor: (color: AvailableColor) => void;
  setComponentColor: (component: keyof DefaultColors, color: AvailableColor) => void;
}

/**
 * Context for providing default component colors with update capabilities
 */
const DefaultColorContext = createContext<DefaultColorContextValue>({
  colors: builtinDefaults,
  setGlobalColor: () => {},
  setComponentColor: () => {},
});

/**
 * Props for the DefaultColorProvider
 */
export interface DefaultColorProviderProps {
  children: ReactNode;
  colors?: Partial<DefaultColors>;
}

/**
 * Enhanced provider component for default colors with update capabilities
 *
 * @example
 * ```tsx
 * // Use built-in defaults
 * <DefaultColorProvider>
 *   <App />
 * </DefaultColorProvider>
 *
 * // Override specific defaults
 * <DefaultColorProvider colors={{ button: 'green', badge: 'blue' }}>
 *   <App />
 * </DefaultColorProvider>
 * ```
 */
export function DefaultColorProvider({ children, colors = {} }: DefaultColorProviderProps) {
  const [currentColors, setCurrentColors] = useState<DefaultColors>({
    ...builtinDefaults,
    ...colors,
  });

  const setGlobalColor = (color: AvailableColor) => {
    setCurrentColors({
      button: color,
      badge: color,
      checkbox: color,
      radio: color,
      switch: color,
    });
  };

  const setComponentColor = (component: keyof DefaultColors, color: AvailableColor) => {
    setCurrentColors(prev => ({
      ...prev,
      [component]: color,
    }));
  };

  const contextValue: DefaultColorContextValue = {
    colors: currentColors,
    setGlobalColor,
    setComponentColor,
  };

  return (
    <DefaultColorContext.Provider value={contextValue}>{children}</DefaultColorContext.Provider>
  );
}

/**
 * Hook to get the default color for a specific component
 *
 * @param component - The component type to get default color for
 * @returns The default color string for the component
 *
 * @example
 * ```tsx
 * function MyButton({ color, ...props }) {
 *   const defaultColor = useDefaultColor('button');
 *   const finalColor = color ?? defaultColor;
 *   return <button className={getColorStyles(finalColor)} {...props} />;
 * }
 * ```
 */
export function useDefaultColor<T>(component: keyof DefaultColors): T {
  const { colors } = useContext(DefaultColorContext);
  return colors[component] as T;
}

/**
 * Hook to get all default colors and update functions
 *
 * @returns The complete default color configuration and update functions
 */
export function useDefaultColors() {
  return useContext(DefaultColorContext);
}
