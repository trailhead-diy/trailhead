/**
 * Checkbox component transforms
 */

export { checkboxAddSemanticColorsTransform as addSemanticColors } from './add-semantic-colors'
export { checkboxColorMappingsTransform as colorMappings } from './color-mappings'
export { checkboxSemanticEnhancementTransform as semanticEnhancement } from './semantic-enhancement'

// Re-export semantic styles function
export { createSemanticCheckboxStyles } from './semantic-styles'

// Re-export all transforms as an array for pipeline usage
export const checkboxTransforms = [
  () => import('./color-mappings'),
  () => import('./semantic-enhancement'),
  () => import('./add-semantic-colors'),
]
