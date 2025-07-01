/**
 * Switch semantic styles
 * Creates CSS variables for semantic switch colors
 */

import { createCSSVariableStyles } from '../common/semantic-tokens/utilities/semantic-styles-factory.js'

/**
 * Create semantic switch styles
 * Created using semantic styles factory for consistent behavior
 */
export const createSemanticSwitchStyles = createCSSVariableStyles(
  (token: string) => [
    `[--switch-bg-ring:var(--color-${token})]`,
    `[--switch-bg:var(--color-${token})]`,
    `dark:[--switch-bg:var(--color-${token})]`,
  ]
)