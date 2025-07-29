/**
 * Preset theme configuration - no runtime switching
 * This provides a lightweight theme setup without any state management
 */

import type { ThemeState } from './types'

// Your preset theme configuration
export const PRESET_THEME: ThemeState = {
  mode: 'light', // or 'dark' if you prefer
  primary: 'purple', // Choose your primary color
  secondary: 'slate', // Choose your secondary color
  destructive: 'red', // Usually stays red
  base: 'gray', // Base gray scale
  layout: 'gray', // Layout gray scale
}

/**
 * Get preset theme classes for SSR
 * Zero runtime overhead - just returns static values
 */
export function getPresetServerTheme() {
  const colorShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
  const styles: string[] = []

  // Generate CSS custom properties
  const colors = [
    { key: 'primary', value: PRESET_THEME.primary },
    { key: 'secondary', value: PRESET_THEME.secondary },
    { key: 'destructive', value: PRESET_THEME.destructive },
    { key: 'base', value: PRESET_THEME.base },
    { key: 'layout', value: PRESET_THEME.layout },
  ]

  colors.forEach(({ key, value }) => {
    colorShades.forEach((shade) => {
      styles.push(`--color-${key}-${shade}: var(--color-${value}-${shade})`)
    })
  })

  // Add semantic color pairs
  const semanticColors = {
    primary: { shade: '500', fg: 'white' },
    secondary: { shade: '600', fg: 'white' },
    destructive: { shade: '600', fg: 'white' },
  }

  Object.entries(semanticColors).forEach(([key, config]) => {
    const color = PRESET_THEME[key as keyof typeof semanticColors]
    styles.push(`--color-${key}: var(--color-${color}-${config.shade})`)
    styles.push(`--color-${key}-foreground: ${config.fg}`)
  })

  return {
    className: PRESET_THEME.mode,
    style: styles.join('; '),
  }
}
