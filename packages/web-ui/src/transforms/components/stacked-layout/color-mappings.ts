/**
 * Color mapping transform for StackedLayout component
 * Maps component-specific color patterns to semantic tokens
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const stackedLayoutColorMappings = makeProtected([
  // Backdrop colors
  {
    pattern: /\bbg-black\/30\b/g,
    replacement: 'bg-foreground/30',
    description: 'Convert black backdrop to foreground with opacity',
  },

  // Background colors
  {
    pattern: /\bbg-white\b/g,
    replacement: 'bg-background',
    description: 'Convert white background to semantic background',
  },
  {
    pattern: /\blg:bg-white\b/g,
    replacement: 'lg:bg-background',
    description: 'Convert large screen white background to semantic background',
  },

  // Ring colors
  {
    pattern: /\bring-zinc-950\/5\b/g,
    replacement: 'ring-border',
    description: 'Convert zinc ring to semantic border',
  },
  {
    pattern: /\blg:ring-zinc-950\/5\b/g,
    replacement: 'lg:ring-border',
    description: 'Convert large screen zinc ring to semantic border',
  },

  // Dark mode patterns
  {
    pattern: /\bdark:lg:bg-zinc-900\b/g,
    replacement: 'dark:lg:bg-card',
    description: 'Convert dark mode zinc-900 background to card',
  },
  {
    pattern: /\bdark:lg:ring-white\/10\b/g,
    replacement: 'dark:lg:ring-ring',
    description: 'Convert dark mode white ring to semantic ring',
  },
])

/**
 * StackedLayout color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const stackedLayoutColorMappingsTransform = createProtectedRegexTransform({
  name: 'stacked-layout-color-mappings',
  description: 'Transform stacked layout backdrop, backgrounds, and ring colors to semantic tokens',
  mappings: stackedLayoutColorMappings,
  changeType: 'stacked-layout-color-semantic',

  // Only apply to stacked-layout component files
  contentFilter: (content) => content.includes('export function StackedLayout'),
})
