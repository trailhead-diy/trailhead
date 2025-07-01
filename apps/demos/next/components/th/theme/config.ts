/**
 * Theme Configuration System
 *
 * Provides utilities for configuring shadcn-compatible themes with optional
 * component-specific overrides. Supports both base shadcn themes and extended
 * Catalyst component themes.
 */

export interface ShadcnTheme {
  // Core Variables
  background: string
  foreground: string
  card: string
  'card-foreground': string
  popover: string
  'popover-foreground': string
  primary: string
  'primary-foreground': string
  secondary: string
  'secondary-foreground': string
  muted: string
  'muted-foreground': string
  accent: string
  'accent-foreground': string
  destructive: string
  'destructive-foreground': string
  border: string
  input: string
  ring: string

  // Chart Colors
  'chart-1': string
  'chart-2': string
  'chart-3': string
  'chart-4': string
  'chart-5': string

  // Sidebar Colors (shadcn compatible)
  sidebar: string
  'sidebar-foreground': string
  'sidebar-primary': string
  'sidebar-primary-foreground': string
  'sidebar-accent': string
  'sidebar-accent-foreground': string
  'sidebar-border': string
  'sidebar-ring': string
}

/**
 * Extended theme interface with optional semantic tokens
 * All enhanced tokens are optional - themes can be as simple or complex as needed
 */
export interface TrailheadTheme extends ShadcnTheme {
  // Optional Hierarchical Text Tokens
  'tertiary-foreground'?: string // Medium contrast text
  'quaternary-foreground'?: string // Lower contrast text

  // Optional Icon State Tokens
  'icon-primary'?: string // Primary action icons
  'icon-secondary'?: string // Secondary action icons
  'icon-inactive'?: string // Inactive/disabled icons
  'icon-active'?: string // Active/selected icons
  'icon-hover'?: string // Hover state icons
  'icon-muted'?: string // Decorative/low-priority icons

  // Optional Border Weight Tokens
  'border-strong'?: string // High contrast borders
  'border-subtle'?: string // Low contrast borders
  'border-ghost'?: string // Very subtle borders

  // Optional Component-Specific Tokens
  'sidebar-text-primary'?: string
  'sidebar-text-secondary'?: string
  'sidebar-icon-default'?: string
  'sidebar-icon-active'?: string
  'table-header-text'?: string
  'table-body-text'?: string
  'button-text-default'?: string
  'button-text-hover'?: string

  // Allow any additional custom tokens
  [key: string]: string | undefined
}

export interface ComponentThemeOverrides {
  // Button Component
  button?: {
    'primary-bg'?: string
    'primary-text'?: string
    'primary-hover'?: string
    'secondary-bg'?: string
    'secondary-text'?: string
    'outline-border'?: string
    'outline-text'?: string
    'ghost-hover'?: string
  }

  // Table Component
  table?: {
    'header-bg'?: string
    'header-text'?: string
    'row-hover'?: string
    'row-stripe'?: string
    border?: string
    'cell-border'?: string
  }

  // Input Component
  input?: {
    bg?: string
    border?: string
    'border-focus'?: string
    text?: string
    placeholder?: string
    'disabled-bg'?: string
    'disabled-text'?: string
  }

  // Navigation Component
  nav?: {
    'item-hover'?: string
    'item-active'?: string
    'item-active-text'?: string
    border?: string
  }

  // Dialog Component
  dialog?: {
    bg?: string
    text?: string
    border?: string
    overlay?: string
  }

  // Badge Component
  badge?: {
    'default-bg'?: string
    'default-text'?: string
    'success-bg'?: string
    'success-text'?: string
    'warning-bg'?: string
    'warning-text'?: string
    'error-bg'?: string
    'error-text'?: string
  }

  // Allow additional component overrides
  [key: string]: any
}

export interface TrailheadThemeConfig {
  name: string
  light: TrailheadTheme
  dark: TrailheadTheme
  components?: ComponentThemeOverrides
}

/**
 * Generate CSS custom properties for a theme configuration
 * Only outputs variables that are defined in the theme
 */
export function generateThemeCSS(
  config: TrailheadThemeConfig,
  options: {
    includeBaseClass?: boolean
    includeDarkMode?: boolean
    includeComponents?: boolean
  } = {}
): string {
  const { includeBaseClass = true, includeDarkMode = true, includeComponents = true } = options

  let css = ''

  // Base theme (light mode)
  if (includeBaseClass) {
    css += ':root {\n'
    css += '  --radius: 0.625rem;\n'

    // Add only defined variables
    Object.entries(config.light).forEach(([key, value]) => {
      if (value !== undefined) {
        css += `  --${key}: ${value};\n`
      }
    })

    // Add component variables if provided
    if (includeComponents && config.components) {
      Object.entries(config.components).forEach(([component, vars]) => {
        if (vars) {
          Object.entries(vars).forEach(([key, value]) => {
            if (value !== undefined) {
              css += `  --${component}-${key}: ${value};\n`
            }
          })
        }
      })
    }

    css += '}\n\n'
  }

  // Dark mode theme
  if (includeDarkMode) {
    css += '.dark {\n'

    // Add only defined dark mode variables
    Object.entries(config.dark).forEach(([key, value]) => {
      if (value !== undefined) {
        css += `  --${key}: ${value};\n`
      }
    })

    // Add dark mode component adjustments if provided
    if (includeComponents && config.components) {
      Object.entries(config.components).forEach(([component, vars]) => {
        if (vars) {
          Object.entries(vars).forEach(([key, value]) => {
            if (value !== undefined && (key.includes('dark-') || key.includes('hover'))) {
              css += `  --${component}-${key}: ${value};\n`
            }
          })
        }
      })
    }

    css += '}\n'
  }

  return css
}

/**
 * Apply a theme configuration to the document
 * Only applies variables that are defined in the theme
 */
export function applyTheme(config: TrailheadThemeConfig, isDark = false): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const theme = isDark ? config.dark : config.light

  // Apply only defined theme variables
  Object.entries(theme).forEach(([key, value]) => {
    if (value !== undefined) {
      root.style.setProperty(`--${key}`, value)
    }
  })

  // Apply component variables if provided
  if (config.components) {
    Object.entries(config.components).forEach(([component, vars]) => {
      if (vars) {
        Object.entries(vars).forEach(([key, value]) => {
          if (value !== undefined) {
            root.style.setProperty(`--${component}-${key}`, value as string)
          }
        })
      }
    })
  }
}

/**
 * Create a new theme with the provided configuration
 */
export function createCustomTheme(
  baseConfig: TrailheadThemeConfig,
  overrides: Partial<TrailheadThemeConfig>
): TrailheadThemeConfig {
  return {
    name: overrides.name || `Custom ${baseConfig.name}`,
    light: { ...baseConfig.light, ...(overrides.light || {}) },
    dark: { ...baseConfig.dark, ...(overrides.dark || {}) },
    components: overrides.components || baseConfig.components,
  }
}

/**
 * Validate a theme configuration
 * Only validates required shadcn vars - enhanced vars are optional
 */
export function validateTheme(config: TrailheadThemeConfig): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check only required shadcn properties
  const requiredKeys: (keyof ShadcnTheme)[] = [
    'background',
    'foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'destructive-foreground',
    'border',
    'input',
    'ring',
  ]

  for (const key of requiredKeys) {
    if (config.light[key] === undefined) {
      errors.push(`Missing required light theme property: ${key}`)
    }
    if (config.dark[key] === undefined) {
      errors.push(`Missing required dark theme property: ${key}`)
    }
  }

  // Validate OKLCH format for defined values only
  const oklchRegex = /^oklch\([\d\s./%]+\)$/

  Object.entries(config.light).forEach(([key, value]) => {
    if (value !== undefined && !oklchRegex.test(value)) {
      errors.push(`Invalid OKLCH format in light theme for ${key}: ${value}`)
    }
  })

  Object.entries(config.dark).forEach(([key, value]) => {
    if (value !== undefined && !oklchRegex.test(value)) {
      errors.push(`Invalid OKLCH format in dark theme for ${key}: ${value}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}
