/**
 * Pagination semantic enhancement transform
 * Uses the transform factory for DRY implementation
 * 
 * Pagination components use Button internally and inherit its theming
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Pagination semantic enhancement transform
 * Adds semantic token support to the Pagination components
 */
export const paginationSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Pagination',
  detectPattern: (content) => 
    content.includes('export function Pagination') || 
    content.includes('export function PaginationPage') ||
    content.includes('export function PaginationGap'),
  
  // Pagination doesn't have explicit color props but uses semantic tokens for styling
  defaultColor: '', // No default color needed
  typePattern: 'none', // No color prop
  hasColorsObject: false, // No colors object
  variableName: '', // No variable needed
  useIIFE: false,
  
  // Pagination-specific: Just ensure semantic token imports are present
  applyResolution: () => {
    // Pagination components use Button internally which already has semantic support
    // The color mappings transform handles converting the hardcoded colors
  }
})