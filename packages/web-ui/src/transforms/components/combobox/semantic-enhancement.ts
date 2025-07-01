/**
 * Combobox semantic enhancement transform
 *
 * Since combobox doesn't have a colors object or color prop,
 * this is a no-op transform that maintains compatibility
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Combobox semantic enhancement transform
 * Note: Combobox components don't have color props, so this is minimal
 */
export const comboboxSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Combobox',
  detectPattern: (content) =>
    content.includes('export function Combobox') ||
    content.includes('export function ComboboxOption') ||
    content.includes('export function ComboboxInput'),
  defaultColor: 'zinc',
  typePattern: 'none', // No color prop to update
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})
