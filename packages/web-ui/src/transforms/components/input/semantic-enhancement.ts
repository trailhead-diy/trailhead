/**
 * Input semantic enhancement transform (refactored)
 * Uses the transform factory for DRY implementation
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js';

/**
 * Input semantic enhancement transform
 * Adds semantic token support to the Input component
 */
export const inputSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Input',
  detectPattern: content =>
    content.includes('Input') &&
    content.includes('forwardRef') &&
    content.includes('export const Input ='),
  defaultColor: '', // Input doesn't have default color
  typePattern: 'none', // Input adds new color prop
  propsInterfaceName: 'InputProps',
  isForwardRef: true, // Input uses forwardRef
  hasColorsObject: false, // Input doesn't use colors object
  variableName: 'resolvedStyles',
  useIIFE: false,
});
