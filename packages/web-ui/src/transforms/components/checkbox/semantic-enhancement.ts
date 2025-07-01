/**
 * Checkbox semantic enhancement transform (refactored)
 * Uses the transform factory for DRY implementation
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Checkbox semantic enhancement transform
 * Adds semantic token support to the Checkbox component
 */
export const checkboxSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Checkbox',
  detectPattern: (content) => 
    content.includes('Checkbox') && 
    content.includes('type Color = keyof typeof colors'),
  defaultColor: 'dark/zinc',
  typePattern: 'alias',
  typeAliasName: 'Color',
  hasColorsObject: true,
  variableName: 'resolvedColorClasses',
  useIIFE: true, // Checkbox uses IIFE pattern
})
