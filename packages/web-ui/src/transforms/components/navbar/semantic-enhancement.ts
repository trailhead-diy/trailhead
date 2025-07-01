/**
 * Navbar semantic enhancement transform
 *
 * Since navbar doesn't have a colors object or color prop,
 * this is a no-op transform that maintains compatibility
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Navbar semantic enhancement transform
 * Note: Navbar components don't have color props, so this is minimal
 */
export const navbarSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Navbar',
  detectPattern: (content) =>
    content.includes('export function Navbar') ||
    content.includes('export const NavbarItem') ||
    content.includes('export function NavbarDivider'),
  defaultColor: 'zinc',
  typePattern: 'none', // No color prop to update
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})
