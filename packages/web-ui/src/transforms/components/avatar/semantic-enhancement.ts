/**
 * Avatar semantic enhancement transform
 * Uses the transform factory for DRY implementation
 *
 * Avatars don't have explicit color props but we enhance for focus states
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Avatar semantic enhancement transform
 * Adds semantic token support to the Avatar component
 */
export const avatarSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Avatar',
  detectPattern: (content) =>
    (content.includes('export function Avatar') || content.includes('export const AvatarButton')) &&
    content.includes('data-slot="avatar"'),

  // Avatar doesn't have color variations, but we ensure semantic tokens for borders and focus
  defaultColor: '', // No default color needed
  typePattern: 'none', // No color prop
  hasColorsObject: false, // No colors object
  variableName: '', // No variable needed
  useIIFE: false,

  // Avatar-specific: Just ensure semantic token imports are present
  applyResolution: () => {
    // Avatar doesn't need resolution logic since it doesn't have color variations
    // The color mappings transform handles converting the hardcoded colors
  },
})
