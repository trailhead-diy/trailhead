/**
 * Color mapping transform for Divider component
 * Maps component-specific color patterns to semantic tokens
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const dividerColorMappings = makeProtected([
  // Border colors
  {
    pattern: /\bborder-zinc-950\/5\b/g,
    replacement: 'border-border/50',
    description: 'Convert zinc border with low opacity to semantic border',
  },
  {
    pattern: /\bborder-zinc-950\/10\b/g,
    replacement: 'border-border',
    description: 'Convert zinc border to semantic border',
  },
  // dark:border-border is already using semantic tokens
])

/**
 * Divider color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const dividerColorMappingsTransform = createProtectedRegexTransform({
  name: 'divider-color-mappings',
  description: 'Transform divider border colors to semantic tokens',
  mappings: dividerColorMappings,
  changeType: 'divider-color-semantic',

  // Only apply to divider component files
  contentFilter: (content) => content.includes('export function Divider'),
})
