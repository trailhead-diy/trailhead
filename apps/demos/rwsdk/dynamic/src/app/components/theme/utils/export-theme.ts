import type { ThemeState } from '../types'

// Cache computed styles for performance
let cachedStyles: CSSStyleDeclaration | null = null

/**
 * Gets Tailwind color values from CSS variables at runtime
 * @param colorName - The color name (e.g., 'purple', 'slate')
 * @param shade - The shade value (e.g., '50', '600')
 * @returns The computed color value or CSS variable reference
 */
function getTailwindColorValue(colorName: string, shade: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback - just return the variable reference
    return `var(--color-${colorName}-${shade})`
  }

  // Cache the computed styles object
  if (!cachedStyles) {
    cachedStyles = getComputedStyle(document.documentElement)
  }

  const value = cachedStyles.getPropertyValue(`--color-${colorName}-${shade}`)

  // Return the computed value or the CSS variable reference
  return value.trim() || `var(--color-${colorName}-${shade})`
}

// Get the appropriate contrast shade for each color
const CONTRAST_SHADES: Record<string, string> = {
  // Light colors need dark foreground
  cyan: '950',
  amber: '950',
  yellow: '950',
  lime: '950',
  // All other colors use white
  zinc: 'white',
  slate: 'white',
  gray: 'white',
  neutral: 'white',
  stone: 'white',
  red: 'white',
  orange: 'white',
  green: 'white',
  emerald: 'white',
  teal: 'white',
  sky: 'white',
  blue: 'white',
  indigo: 'white',
  violet: 'white',
  purple: 'white',
  fuchsia: 'white',
  pink: 'white',
  rose: 'white',
}

/**
 * Generates CSS for a preset theme based on current theme state
 * @param theme - The current theme state object
 * @returns Complete CSS string including @theme block and setup example
 */
export function generateThemeCSS(theme: ThemeState): string {
  // Clear cache to ensure fresh values
  cachedStyles = null

  const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

  // Helper to generate color definitions for a category
  const generateColorSet = (category: string, colorName: string): string => {
    return shades
      .map((shade) => `  --color-${category}-${shade}: ${getTailwindColorValue(colorName, shade)};`)
      .join('\n')
  }

  // Helper to get foreground color
  const getForeground = (colorName: string): string => {
    const fg = CONTRAST_SHADES[colorName]
    return fg === 'white' ? 'white' : `var(--color-${colorName}-${fg})`
  }

  return `/* Preset Theme CSS - Generated from Theme Dialog */
/* Theme: ${theme.primary} primary, ${theme.secondary} secondary, ${theme.base} base */
/* Mode: ${theme.mode} */

@import 'tailwindcss';

@theme {
  /* Color definitions using oklch for perceptual uniformity */
  
  /* Primary: ${theme.primary} */
${generateColorSet('primary', theme.primary)}

  /* Secondary: ${theme.secondary} */
${generateColorSet('secondary', theme.secondary)}

  /* Destructive: ${theme.destructive} */
${generateColorSet('destructive', theme.destructive)}

  /* Base: ${theme.base} */
${generateColorSet('base', theme.base)}

  /* Layout: ${theme.layout} */
${generateColorSet('layout', theme.layout)}

  /* Semantic color pairs for proper contrast */
  --color-primary: var(--color-primary-600);
  --color-primary-foreground: ${getForeground(theme.primary)};
  
  --color-secondary: var(--color-secondary-600);
  --color-secondary-foreground: ${getForeground(theme.secondary)};
  
  --color-destructive: var(--color-destructive-600);
  --color-destructive-foreground: ${getForeground(theme.destructive)};
  
  /* Additional semantic colors */
  --color-success: var(--color-green-600);
  --color-success-foreground: white;
  
  --color-warning: var(--color-yellow-500);
  --color-warning-foreground: var(--color-yellow-950);
  
  --color-info: var(--color-blue-600);
  --color-info-foreground: white;
}`
}

/**
 * Copies text to clipboard with fallback for older browsers
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}
