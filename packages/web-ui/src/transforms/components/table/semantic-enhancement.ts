/**
 * Table semantic enhancement transform
 *
 * Since table doesn't have a colors object or color prop,
 * this is a no-op transform that maintains compatibility
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Table semantic enhancement transform
 * Note: Table components don't have color props, so this is minimal
 */
export const tableSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Table',
  detectPattern: (content) =>
    content.includes('export function Table') ||
    content.includes('export function TableRow') ||
    content.includes('export function TableCell'),
  defaultColor: 'zinc',
  typePattern: 'none', // No color prop to update
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})
