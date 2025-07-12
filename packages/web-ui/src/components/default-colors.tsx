'use client';

import { createContext, useContext, type ReactNode } from 'react';

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
 * Context for providing default component colors
 */
const DefaultColorContext = createContext<DefaultColors>(builtinDefaults);

/**
 * Props for the DefaultColorProvider
 */
export interface DefaultColorProviderProps {
  children: ReactNode;
  colors?: Partial<DefaultColors>;
}

/**
 * Provider component for default colors
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
  const mergedColors = { ...builtinDefaults, ...colors };

  return (
    <DefaultColorContext.Provider value={mergedColors}>{children}</DefaultColorContext.Provider>
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
  const colors = useContext(DefaultColorContext);
  return colors[component] as T;
}

/**
 * Hook to get all default colors
 *
 * @returns The complete default color configuration
 */
export function useDefaultColors(): DefaultColors {
  return useContext(DefaultColorContext);
}
