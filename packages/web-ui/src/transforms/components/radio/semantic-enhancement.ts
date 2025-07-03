/**
 * Radio semantic enhancement transform (refactored)
 * Uses the transform factory for DRY implementation
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js';

/**
 * Radio semantic enhancement transform
 * Adds semantic token support to the Radio component
 */
export const radioSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Radio',
  detectPattern: content =>
    content.includes('Radio') &&
    content.includes('type Color = keyof typeof colors') &&
    content.includes('export function Radio'),
  defaultColor: 'dark/zinc',
  typePattern: 'alias',
  typeAliasName: 'Color',
  hasColorsObject: true,
  variableName: 'resolvedColorClasses',
  useIIFE: true, // Radio uses IIFE pattern like Checkbox
});
