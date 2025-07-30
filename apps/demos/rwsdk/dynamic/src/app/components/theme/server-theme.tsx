/**
 * Server-side theme utilities
 * These functions help apply theme during SSR based on cookies
 */

import type { ThemeState } from './types'
import { getThemeFromCookieHeader } from './cookies'

const COLOR_SHADES = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
] as const

/**
 * Gets the active mode, resolving 'system' to actual preference
 * For SSR, we default to 'light' when system is selected
 */
function getActiveMode(mode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  // On server, we can't detect system preference, so default to light
  return mode === 'system' ? 'light' : mode
}

/**
 * Generates CSS variable overrides for theme colors
 */
function generateThemeStyles(theme: ThemeState): string {
  const styles: string[] = []

  const colors = [
    { key: 'primary', value: theme.primary },
    { key: 'secondary', value: theme.secondary },
    { key: 'destructive', value: theme.destructive },
    { key: 'base', value: theme.base },
  ]

  colors.forEach(({ key, value }) => {
    COLOR_SHADES.forEach((shade) => {
      styles.push(`--color-${key}-${shade}: var(--color-${value}-${shade});`)
    })
  })

  return styles.join(' ')
}

/**
 * Gets theme classes and styles from cookie header for SSR
 */
export function getServerTheme(cookieHeader: string | null): {
  className: string
  style: string
} {
  const theme = getThemeFromCookieHeader(cookieHeader)

  if (!theme) {
    return {
      className: 'light', // Default to light mode
      style: '',
    }
  }

  const activeMode = getActiveMode(theme.mode)
  const themeStyles = generateThemeStyles(theme)

  return {
    className: activeMode,
    style: themeStyles,
  }
}
