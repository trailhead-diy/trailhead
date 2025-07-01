/**
 * Dialog semantic enhancement transform
 *
 * Since dialog doesn't have a colors object or color prop,
 * this is a no-op transform that maintains compatibility
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Dialog semantic enhancement transform
 * Note: Dialog components don't have color props, so this is minimal
 */
export const dialogSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Dialog',
  detectPattern: (content) =>
    content.includes('export function Dialog') ||
    content.includes('export function DialogTitle') ||
    content.includes('export function DialogDescription'),
  defaultColor: 'zinc',
  typePattern: 'none', // No color prop to update
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})
