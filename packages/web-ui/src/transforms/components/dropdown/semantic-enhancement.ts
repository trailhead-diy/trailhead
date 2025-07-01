/**
 * Dropdown semantic enhancement transform
 *
 * Since dropdown doesn't have a colors object or color prop,
 * this is a no-op transform that maintains compatibility
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Dropdown semantic enhancement transform
 * Note: Dropdown components don't have color props, so this is minimal
 */
export const dropdownSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Dropdown',
  detectPattern: (content) =>
    content.includes('export function Dropdown') ||
    content.includes('export function DropdownItem') ||
    content.includes('export function DropdownMenu'),
  defaultColor: 'zinc',
  typePattern: 'none', // No color prop to update
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})
