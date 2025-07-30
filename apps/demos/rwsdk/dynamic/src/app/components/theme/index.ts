/**
 * Theme System Public API
 *
 * KISS approach: Just two components that do one thing well
 */

// Core functionality (internal use only)
export { setupSystemThemeListener } from './store'

// Cookie utilities for SSR
export { getThemeFromCookieHeader, parseThemeCookie } from './cookies'

// Server-side theme utilities
export { getServerTheme } from './server-theme'

// Hooks for custom implementations
export {
  useMode,
  usePrimary,
  useSecondary,
  useDestructive,
  useBase,
  useLayout,
  useThemeActions,
} from './hooks'

// UI Components (just two!)
export { ThemeControl } from './ui/theme-control'
export { ThemeModeToggle } from './ui/theme-mode-toggle'

// Internal components (not for direct use)
export { ThemeDialog } from './ui/theme-dialog'
export { Initializer } from './Initializer'

// Constants
export { COLOR_MODES, GRAY_NAMES, COLOR_NAMES, LIGHT_COLORS } from './constants'

// Types
export type { ColorMode, ColorName, ThemeStore, ThemeState, ThemeActions } from './types'
