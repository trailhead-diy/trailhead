/**
 * Alert semantic enhancement transform
 *
 * Since alert doesn't have a colors object or color prop,
 * this is a no-op transform that maintains compatibility
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Alert semantic enhancement transform
 * Note: Alert components don't have color props, so this is minimal
 */
export const alertSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Alert',
  detectPattern: (content) =>
    content.includes('export function Alert') ||
    content.includes('export function AlertTitle') ||
    content.includes('export function AlertDescription'),
  defaultColor: 'zinc',
  typePattern: 'none', // No color prop to update
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})
