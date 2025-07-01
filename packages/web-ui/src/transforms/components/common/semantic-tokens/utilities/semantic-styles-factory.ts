/**
 * Semantic Styles Factory
 * Creates semantic style functions with unified patterns across all components
 */

import type { SemanticColorToken } from '../types.js'

/**
 * Shared semantic token resolution utility
 * Pure function that maps semantic tokens to CSS variable names
 */
function resolveSemanticToken(token: SemanticColorToken): string {
  // Handle special Tailwind colors that might map to specific color values
  // For now, all tokens map to themselves (could be extended for complex mappings)
  return token
}

/**
 * Configuration for object lookup pattern (badge, input, text, link style components)
 */
interface ObjectLookupConfig {
  pattern: 'object-lookup'
  styles: Record<SemanticColorToken, string>
  defaultToken: SemanticColorToken
}

/**
 * Configuration for CSS variable template pattern (button, checkbox, radio, switch style components)
 */
interface CSSVariableConfig {
  pattern: 'css-variables'
  template: (token: string) => string[]
}

/**
 * Union type for all semantic style configurations
 */
type SemanticStyleConfig = ObjectLookupConfig | CSSVariableConfig

/**
 * Create a semantic style function based on configuration
 * Pure function that returns a function for generating semantic styles
 *
 * @param config - Configuration object defining the pattern and behavior
 * @returns Function that takes a SemanticColorToken and returns CSS classes
 */
export function createSemanticStylesFunction<T extends SemanticStyleConfig>(
  config: T
): (color: SemanticColorToken) => string {
  switch (config.pattern) {
    case 'object-lookup':
      // Object lookup pattern: simple dictionary lookup with fallback
      return (color: SemanticColorToken): string => {
        return config.styles[color] || config.styles[config.defaultToken]
      }

    case 'css-variables':
      // CSS variable template pattern: resolve token and apply template
      return (color: SemanticColorToken): string => {
        const resolvedToken = resolveSemanticToken(color)
        return config.template(resolvedToken).join(' ')
      }

    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = config
      throw new Error(`Unknown pattern: ${JSON.stringify(_exhaustive)}`)
  }
}

/**
 * Pre-configured factory functions for common patterns
 * These provide convenience functions for the most common use cases
 */

/**
 * Create object lookup style function
 * Convenience wrapper for object-lookup pattern
 */
export function createObjectLookupStyles(
  styles: Record<SemanticColorToken, string>,
  defaultToken: SemanticColorToken = 'primary'
) {
  return createSemanticStylesFunction({
    pattern: 'object-lookup',
    styles,
    defaultToken,
  })
}

/**
 * Create CSS variable template style function
 * Convenience wrapper for css-variables pattern
 */
export function createCSSVariableStyles(template: (token: string) => string[]) {
  return createSemanticStylesFunction({
    pattern: 'css-variables',
    template,
  })
}
