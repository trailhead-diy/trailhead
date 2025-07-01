/**
 * Semantic enhancement transform for Select component
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

export const selectSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Select',
  
  // Detection pattern - check for Select forwardRef
  detectPattern: (content: string) => {
    return content.includes('export const Select = forwardRef') &&
           content.includes('function Select')
  },
  
  // Default color fallback
  defaultColor: 'primary',
  
  // Select doesn't have a type alias or props interface for color
  typePattern: 'none',
  
  // Using forwardRef
  isForwardRef: true,
  
  // No colors object in this component
  hasColorsObject: false,
  
  // Variable name for resolved classes
  variableName: 'resolvedColorClasses',
  
  // Don't use IIFE pattern
  useIIFE: false
})

export default selectSemanticEnhancementTransform