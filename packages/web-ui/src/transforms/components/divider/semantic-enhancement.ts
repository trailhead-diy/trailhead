/**
 * Divider semantic enhancement transform
 * Uses the transform factory for DRY implementation
 *
 * Dividers have a soft prop but no explicit color variations
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js';

/**
 * Divider semantic enhancement transform
 * Adds semantic token support to the Divider component
 */
export const dividerSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Divider',
  detectPattern: content =>
    content.includes('export function Divider') && content.includes('role="presentation"'),

  // Divider doesn't have color prop but uses semantic tokens based on soft prop
  defaultColor: '', // No default color needed
  typePattern: 'none', // No color prop
  hasColorsObject: false, // No colors object
  variableName: '', // No variable needed
  useIIFE: false,

  // Divider-specific: Just ensure semantic token imports are present
  applyResolution: () => {
    // Divider doesn't need resolution logic since it uses semantic tokens directly
    // The color mappings transform handles converting the hardcoded colors
  },
});
