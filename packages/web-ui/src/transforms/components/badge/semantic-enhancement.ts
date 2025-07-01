/**
 * Badge semantic enhancement transform (refactored)
 * Uses the transform factory for DRY implementation
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Badge semantic enhancement transform
 * Adds semantic token support to the Badge component
 */
export const badgeSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Badge',
  detectPattern: (content) =>
    content.includes('Badge') &&
    content.includes('colors') &&
    content.includes('export function Badge'),
  defaultColor: 'zinc',
  typePattern: 'prop', // Badge updates existing color prop type
  hasColorsObject: true,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})
