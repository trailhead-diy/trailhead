/**
 * Semantic enhancement transform for Sidebar component
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

export const sidebarSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Sidebar',

  // Detection pattern - check for Sidebar function declaration
  detectPattern: (content: string) => {
    return (
      content.includes('export function Sidebar') &&
      content.includes('SidebarHeader') &&
      content.includes('SidebarBody')
    )
  },

  // Default color fallback
  defaultColor: 'primary',

  // Sidebar doesn't have a type alias or props interface for color
  typePattern: 'none',

  // Not using forwardRef for main component
  isForwardRef: false,

  // No colors object in this component
  hasColorsObject: false,

  // Variable name for resolved classes
  variableName: 'resolvedColorClasses',

  // Don't use IIFE pattern
  useIIFE: false,
})
