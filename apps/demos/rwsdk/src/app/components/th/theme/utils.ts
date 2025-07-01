/**
 * Theme Utilities
 *
 * Additional utilities for theme manipulation, validation, and export/import
 */

import { type TrailheadThemeConfig, type ShadcnTheme, type TrailheadTheme, validateTheme } from './config'
import { oklch, parse, wcagContrast, clampChroma } from 'culori'
import type { Oklch } from 'culori'

// ============================================================================
// TYPES
// ============================================================================

/**
 * OKLCH color representation as immutable data
 * Compatible with culori's Oklch type
 */
export interface OKLCHColorData extends Oklch {
  mode: 'oklch'
  l: number // lightness 0-1
  c: number // chroma 0-0.4
  h?: number // hue 0-360 (optional for achromatic colors)
  alpha?: number // alpha 0-1
}

// ============================================================================
// PURE COLOR FUNCTIONS USING CULORI
// ============================================================================

/**
 * Parse OKLCH color string into color data
 * Leverages culori's robust color parsing
 */
export const parseOKLCHColor = (color: string): OKLCHColorData => {
  const parsed = parse(color)
  if (!parsed) {
    throw new Error(`Invalid color: ${color}`)
  }

  // Convert to OKLCH if needed
  const oklchColor = oklch(parsed)
  if (!oklchColor) {
    throw new Error(`Cannot convert to OKLCH: ${color}`)
  }

  return {
    mode: 'oklch',
    l: oklchColor.l,
    c: oklchColor.c,
    h: oklchColor.h,
    alpha: oklchColor.alpha,
  }
}

/**
 * Convert color data to OKLCH string
 * Uses culori's formatting with custom precision
 */
export const formatOKLCHColor = (color: OKLCHColorData): string => {
  const { l, c, h = 0, alpha = 1 } = color

  if (alpha === 1) {
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)})`
  }
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)} / ${alpha})`
}

/**
 * Adjust lightness by a specific amount
 * Pure function returning new color data
 */
export const adjustLightness = (color: OKLCHColorData, amount: number): OKLCHColorData => ({
  ...color,
  l: Math.max(0, Math.min(1, color.l + amount)),
})

/**
 * Adjust chroma (saturation) by a specific amount
 * Pure function returning new color data
 */
export const adjustChroma = (color: OKLCHColorData, amount: number): OKLCHColorData => ({
  ...color,
  c: Math.max(0, color.c + amount),
})

/**
 * Rotate hue by degrees
 * Pure function returning new color data
 */
export const rotateHue = (color: OKLCHColorData, degrees: number): OKLCHColorData => ({
  ...color,
  h: ((color.h || 0) + degrees) % 360,
})

/**
 * Get contrasting color (for text on this background)
 * Uses WCAG contrast calculations for better accuracy
 */
export const getContrastingColor = (color: OKLCHColorData): OKLCHColorData => {
  // Calculate contrast with both black and white
  const blackContrast = wcagContrast(color, { mode: 'oklch', l: 0.145, c: 0, h: 0 })
  const whiteContrast = wcagContrast(color, { mode: 'oklch', l: 0.985, c: 0, h: 0 })

  // Choose the color with better contrast
  const contrastLightness = whiteContrast > blackContrast ? 0.985 : 0.145

  return {
    mode: 'oklch',
    l: contrastLightness,
    c: 0,
    h: 0,
    alpha: color.alpha,
  }
}

/**
 * Invert for dark mode
 * Pure function returning new color data
 */
export const invertForDarkMode = (color: OKLCHColorData): OKLCHColorData => ({
  ...color,
  l: 1 - color.l,
})

/**
 * Ensure color is within sRGB gamut
 * Uses culori's clampChroma for OKLCH colors
 */
export const ensureInGamut = (color: OKLCHColorData): OKLCHColorData => {
  // For OKLCH colors, clampChroma is more appropriate
  // It reduces chroma while maintaining the same lightness and hue
  const clamped = clampChroma(color, 'oklch')

  return {
    mode: 'oklch',
    l: clamped.l,
    c: clamped.c,
    h: clamped.h,
    alpha: clamped.alpha,
  }
}

/**
 * Clamp chroma to ensure color is displayable
 * Uses culori's clampChroma for accurate results
 */
export const clampColorChroma = (color: OKLCHColorData): OKLCHColorData => {
  const clamped = clampChroma(color, 'oklch') as OKLCHColorData
  return {
    ...clamped,
    mode: 'oklch',
  }
}

// ============================================================================
// COMPOSITION UTILITIES
// ============================================================================

/**
 * Compose color transformations
 * Higher-order function for chaining color operations
 */
export const composeColorTransforms =
  (...transforms: Array<(color: OKLCHColorData) => OKLCHColorData>) =>
    (color: OKLCHColorData): OKLCHColorData =>
      transforms.reduce((acc, transform) => transform(acc), color)

/**
 * Create a color transformer from string to string
 * Convenience function for string-based operations
 */
export const createColorTransformer =
  (transform: (color: OKLCHColorData) => OKLCHColorData) =>
    (colorString: string): string => {
      const color = parseOKLCHColor(colorString)
      const transformed = transform(color)
      return formatOKLCHColor(transformed)
    }

// ============================================================================
// THEME UTILITIES
// ============================================================================

/**
 * Generate a complete color palette from a base color
 * Now uses culori for accurate color manipulation
 */
export function generateColorPalette(baseColor: string): {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
} {
  const base = parseOKLCHColor(baseColor)

  // Create transformers for each shade with gamut mapping
  const createShade = (lightnessAdjust: number, chromaMultiplier: number) =>
    composeColorTransforms(
      (color) => adjustLightness(color, lightnessAdjust),
      (color) => ({ ...color, c: color.c * chromaMultiplier }),
      ensureInGamut
    )

  return {
    50: formatOKLCHColor(createShade(0.45, 0.1)(base)),
    100: formatOKLCHColor(createShade(0.35, 0.2)(base)),
    200: formatOKLCHColor(createShade(0.25, 0.4)(base)),
    300: formatOKLCHColor(createShade(0.15, 0.6)(base)),
    400: formatOKLCHColor(createShade(0.05, 0.8)(base)),
    500: baseColor, // Base color
    600: formatOKLCHColor(createShade(-0.05, 1.1)(base)),
    700: formatOKLCHColor(createShade(-0.15, 1.2)(base)),
    800: formatOKLCHColor(createShade(-0.25, 1.3)(base)),
    900: formatOKLCHColor(createShade(-0.35, 1.4)(base)),
    950: formatOKLCHColor(createShade(-0.45, 1.5)(base)),
  }
}

/**
 * Convert a theme to CSS custom properties
 */
export function themeToCSS(
  theme: TrailheadThemeConfig,
  options: {
    selector?: string
    includeComponents?: boolean
    minify?: boolean
  } = {}
): string {
  const { selector = ':root', includeComponents = true, minify = false } = options

  const indent = minify ? '' : '  '
  const lineEnd = minify ? '' : '\n'
  const space = minify ? '' : ' '

  let css = `${selector}${space}{${lineEnd}`

  // Add base theme variables
  Object.entries(theme.light).forEach(([key, value]) => {
    css += `${indent}--${key}:${space}${value};${lineEnd}`
  })

  // Add component variables if requested
  if (includeComponents && theme.components) {
    Object.entries(theme.components).forEach(([component, vars]) => {
      Object.entries(vars || {}).forEach(([key, value]) => {
        if (value) {
          css += `${indent}--${component}-${key}:${space}${value};${lineEnd}`
        }
      })
    })
  }

  css += `}${lineEnd}`

  // Add dark mode if not minified
  if (!minify) {
    css += `${lineEnd}.dark${space}{${lineEnd}`
    Object.entries(theme.dark).forEach(([key, value]) => {
      css += `${indent}--${key}:${space}${value};${lineEnd}`
    })
    css += `}${lineEnd}`
  }

  return css
}

/**
 * Merge multiple themes into one
 */
export function mergeThemes(
  baseTheme: TrailheadThemeConfig,
  ...overrideThemes: Partial<TrailheadThemeConfig>[]
): TrailheadThemeConfig {
  let result = { ...baseTheme }

  for (const override of overrideThemes) {
    result = {
      name: override.name || result.name,
      light: { ...result.light, ...override.light },
      dark: { ...result.dark, ...override.dark },
      components: override.components
        ? { ...result.components, ...override.components }
        : result.components,
    }
  }

  return result
}

/**
 * Extract theme from CSS custom properties
 */
export function extractThemeFromCSS(css: string): TrailheadThemeConfig | null {
  const lightVars: Partial<ShadcnTheme> = {}
  const darkVars: Partial<ShadcnTheme> = {}

  // Extract light theme variables
  const lightMatch = css.match(/:root\s*{([^}]+)}/)
  if (lightMatch) {
    const vars = lightMatch[1]
    const varMatches = Array.from(vars.matchAll(/--([a-z-]+):\s*([^;]+);/g))
    for (const match of varMatches) {
      const [, key, value] = match
      if (key in lightVars) {
        ; (lightVars as any)[key] = value.trim()
      }
    }
  }

  // Extract dark theme variables
  const darkMatch = css.match(/\.dark\s*{([^}]+)}/)
  if (darkMatch) {
    const vars = darkMatch[1]
    const varMatches = Array.from(vars.matchAll(/--([a-z-]+):\s*([^;]+);/g))
    for (const match of varMatches) {
      const [, key, value] = match
      if (key in darkVars) {
        ; (darkVars as any)[key] = value.trim()
      }
    }
  }

  // Return null if not enough variables found
  if (Object.keys(lightVars).length < 5 || Object.keys(darkVars).length < 5) {
    return null
  }

  return {
    name: 'Extracted Theme',
    light: lightVars as TrailheadTheme,
    dark: darkVars as TrailheadTheme,
  }
}

/**
 * Check theme compatibility with shadcn/ui
 * Now uses culori for color validation
 */
export function checkShadcnCompatibility(theme: TrailheadThemeConfig): {
  compatible: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  const validation = validateTheme(theme)
  if (!validation.isValid) {
    issues.push(...validation.errors)
  }

  // Check for required shadcn variables
  const requiredVars = [
    'background',
    'foreground',
    'card',
    'card-foreground',
    'popover',
    'popover-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'border',
    'input',
    'ring',
  ] as const

  for (const varName of requiredVars) {
    if (!theme.light[varName]) {
      issues.push(`Missing light theme variable: ${varName}`)
    }
    if (!theme.dark[varName]) {
      issues.push(`Missing dark theme variable: ${varName}`)
    }
  }

  // Check OKLCH format using culori
  Object.entries(theme.light).forEach(([key, value]) => {
    if (!value) {
      issues.push(`Light theme ${key} is missing value`)
      return
    }
    try {
      const parsed = parse(value)
      if (!parsed) {
        issues.push(`Light theme ${key} has invalid color format: ${value}`)
      } else {
        // Check if it's already in OKLCH or can be converted
        const asOklch = oklch(parsed)
        if (!asOklch) {
          issues.push(`Light theme ${key} cannot be converted to OKLCH: ${value}`)
        }
      }
    } catch {
      issues.push(`Light theme ${key} has invalid color: ${value}`)
    }
  })

  Object.entries(theme.dark).forEach(([key, value]) => {
    if (!value) {
      issues.push(`Dark theme ${key} is missing value`)
      return
    }
    try {
      const parsed = parse(value)
      if (!parsed) {
        issues.push(`Dark theme ${key} has invalid color format: ${value}`)
      } else {
        const asOklch = oklch(parsed)
        if (!asOklch) {
          issues.push(`Dark theme ${key} cannot be converted to OKLCH: ${value}`)
        }
      }
    } catch {
      issues.push(`Dark theme ${key} has invalid color: ${value}`)
    }
  })

  // Check contrast ratios using culori's WCAG calculations
  try {
    const bgColor = parseOKLCHColor(theme.light.background)
    const fgColor = parseOKLCHColor(theme.light.foreground)
    const contrast = wcagContrast(bgColor, fgColor)

    if (contrast < 4.5) {
      issues.push(
        `Insufficient contrast between background and foreground in light theme (${contrast.toFixed(2)}:1)`
      )
      suggestions.push('Increase contrast to at least 4.5:1 for WCAG AA compliance')
    }
  } catch {
    issues.push('Unable to validate contrast ratios due to color format issues')
  }

  return {
    compatible: issues.length === 0,
    issues,
    suggestions,
  }
}

/**
 * Auto-fix common theme issues
 */
export function autoFixTheme(theme: TrailheadThemeConfig): TrailheadThemeConfig {
  const fixed = { ...theme }

  // Auto-complete missing card colors
  if (!fixed.light.card) {
    fixed.light.card = fixed.light.background
  }
  if (!fixed.light['card-foreground']) {
    fixed.light['card-foreground'] = fixed.light.foreground
  }
  if (!fixed.dark.card) {
    fixed.dark.card = fixed.dark.background
  }
  if (!fixed.dark['card-foreground']) {
    fixed.dark['card-foreground'] = fixed.dark.foreground
  }

  // Auto-complete popover colors (usually same as card)
  if (!fixed.light.popover) {
    fixed.light.popover = fixed.light.card
  }
  if (!fixed.light['popover-foreground']) {
    fixed.light['popover-foreground'] = fixed.light['card-foreground']
  }
  if (!fixed.dark.popover) {
    fixed.dark.popover = fixed.dark.card
  }
  if (!fixed.dark['popover-foreground']) {
    fixed.dark['popover-foreground'] = fixed.dark['card-foreground']
  }

  return fixed
}

// ============================================================================
// FUNCTIONAL COLOR API EXAMPLES
// ============================================================================

/**
 * Example: Create a lighter variant of a color
 */
export const createLighterVariant = createColorTransformer((color) => adjustLightness(color, 0.1))

/**
 * Example: Create a desaturated variant
 */
export const createDesaturatedVariant = createColorTransformer((color) =>
  adjustChroma(color, -color.c * 0.5)
)

/**
 * Example: Create a complementary color
 */
export const createComplementaryColor = createColorTransformer((color) => rotateHue(color, 180))
