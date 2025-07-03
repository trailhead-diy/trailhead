/**
 * Link semantic enhancement transform (refactored)
 * Uses the transform factory for DRY implementation
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js';

/**
 * Link semantic enhancement transform
 * Adds semantic token support to the Link component
 */
export const linkSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Link',
  detectPattern: content =>
    content.includes('Link') &&
    content.includes('forwardRef') &&
    content.includes('export const Link ='),
  defaultColor: '', // Link doesn't have default color
  typePattern: 'none', // Link adds new color prop
  propsInterfaceName: 'LinkProps',
  isForwardRef: true, // Link uses forwardRef
  hasColorsObject: false, // Link doesn't use colors object
  variableName: 'resolvedStyles',
  useIIFE: false,
});
