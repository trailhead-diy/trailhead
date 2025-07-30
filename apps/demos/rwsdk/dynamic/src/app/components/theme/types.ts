/**
 * Theme system type definitions
 * Used by multiple files (store, UI components)
 */

import type { COLOR_MODES, GRAY_NAMES, COLOR_NAMES } from './constants'

// Basic types derived from constants
/** Color mode: 'light', 'dark', or 'system' (follows OS preference) */
export type ColorMode = (typeof COLOR_MODES)[number]

/** Gray color options for base/neutral colors */
export type GrayColor = (typeof GRAY_NAMES)[number]

/** All available color names from Tailwind palette */
export type ColorName = (typeof COLOR_NAMES)[number]

/**
 * Theme state interface
 * Represents the current theme configuration
 */
export interface ThemeState {
  /** Color mode preference */
  mode: ColorMode
  /** Primary brand color (used for CTAs, links, focus states) */
  primary: ColorName
  /** Secondary color (used for less prominent UI elements) */
  secondary: ColorName
  /** Destructive/danger color (used for errors, warnings, destructive actions) */
  destructive: ColorName
  /** Base gray color (used for backgrounds, borders, text) */
  base: ColorName
  /**
   * Layout color - Controls the visual theme of layout components (Sidebar, StackedLayout, AuthLayout)
   *
   * @remarks
   * While `base` defines the general UI foundation colors, `layout` specifically themes
   * the structural/navigational components. This separation allows for:
   * - Distinct visual hierarchy between content and navigation
   * - Better contrast when using sidebars or stacked layouts
   * - Flexibility to use different gray scales for layout vs content
   *
   * @example
   * // Content area uses stone grays, layout uses zinc for cooler navigation
   * base: 'stone',
   * layout: 'zinc'
   */
  layout: ColorName
}

/**
 * Theme actions interface
 * Methods to update theme state and apply changes
 */
export interface ThemeActions {
  /** Set color mode (light/dark/system) */
  setMode: (mode: ColorMode) => void
  /** Set primary color with validation */
  setPrimary: (color: ColorName) => void
  /** Set secondary color with validation */
  setSecondary: (color: ColorName) => void
  /** Set destructive color with validation */
  setDestructive: (color: ColorName) => void
  /** Set base gray color with validation */
  setBase: (color: ColorName) => void
  /** Set layout color for navigation/structural components with validation */
  setLayout: (color: ColorName) => void
  /** Apply current theme to DOM (debounced) */
  applyTheme: () => void
  /** Hydrate theme on client mount (immediate, no debounce) */
  hydrate: () => void
}

/** Complete theme store type combining state and actions */
export type ThemeStore = ThemeState & ThemeActions
