/**
 * Text semantic enhancement transform (refactored)
 * Uses the transform factory for DRY implementation
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Text semantic enhancement transform
 * Adds semantic token support to the Text component
 */
export const textSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Text',
  detectPattern: (content) => content.includes('Text') && content.includes('function Text'),
  defaultColor: '', // Text doesn't have default color
  typePattern: 'none', // Text adds new color prop
  hasColorsObject: false, // Text doesn't use colors object
  variableName: 'resolvedStyles',
  useIIFE: false,
})
