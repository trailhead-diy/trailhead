/**
 * Color mapping transform for Pagination component
 * Maps component-specific color patterns to semantic tokens
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const paginationColorMappings = makeProtected([
  // Background colors for current page indicator
  {
    pattern: /\bbefore:bg-zinc-950\/5\b/g,
    replacement: 'before:bg-muted/20',
    description: 'Convert zinc background to muted with opacity for current page',
  },
  {
    pattern: /\bdark:before:bg-white\/10\b/g,
    replacement: 'dark:before:bg-muted/20',
    description: 'Convert dark mode white background to muted with opacity',
  },
])

/**
 * Pagination color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const paginationColorMappingsTransform = createProtectedRegexTransform({
  name: 'pagination-color-mappings',
  description: 'Transform pagination current page indicator colors to semantic tokens',
  mappings: paginationColorMappings,
  changeType: 'pagination-color-semantic',

  // Only apply to pagination component files
  contentFilter: (content) =>
    content.includes('export function Pagination') ||
    content.includes('export function PaginationPage') ||
    content.includes('export function PaginationGap'),
})
