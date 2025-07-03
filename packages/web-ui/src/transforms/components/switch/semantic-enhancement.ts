/**
 * Switch semantic enhancement transform (refactored)
 * Uses the transform factory for DRY implementation
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js';

/**
 * Switch semantic enhancement transform
 * Adds semantic token support to the Switch component
 */
export const switchSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Switch',
  detectPattern: content =>
    content.includes('Switch') &&
    content.includes('type Color = keyof typeof colors') &&
    content.includes('export function Switch'),
  defaultColor: 'dark/zinc',
  typePattern: 'alias',
  typeAliasName: 'Color',
  hasColorsObject: true,
  variableName: 'resolvedColorClasses',
  useIIFE: true, // Switch uses IIFE pattern
});
