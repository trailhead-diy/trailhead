/**
 * Alert color mapping transform
 *
 * Converts hardcoded colors to semantic tokens in alert components
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const alertColorMappings = makeProtected([
  // Background overlay colors
  {
    pattern: /bg-zinc-950\/25/g,
    replacement: 'bg-foreground/$1',
    description: 'Convert zinc overlay backgrounds to semantic foreground with opacity',
  },
  {
    pattern: /dark:bg-zinc-950\/50/g,
    replacement: 'dark:bg-foreground/$1',
    description: 'Convert dark mode zinc overlay to semantic foreground with opacity',
  },

  // Ring colors
  {
    pattern: /ring-zinc-950\/10/g,
    replacement: 'ring-ring',
    description: 'Convert zinc ring borders to semantic ring token',
  },
  {
    pattern: /dark:ring-white\/20/g,
    replacement: 'dark:ring-ring',
    description: 'Convert dark mode white ring to semantic ring token',
  },

  // Panel background colors
  {
    pattern: /bg-white/g,
    replacement: 'bg-background',
    description: 'Convert white backgrounds to semantic background',
  },
  {
    pattern: /dark:bg-zinc-900/g,
    replacement: 'dark:bg-card',
    description: 'Convert dark mode zinc panel backgrounds to semantic card',
  },

  // Text colors (if any static ones exist)
  {
    pattern: /text-zinc-950/g,
    replacement: 'text-foreground',
    description: 'Convert zinc text to semantic foreground',
  },
  {
    pattern: /dark:text-white/g,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode white text to semantic foreground',
  },
])

/**
 * Alert color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const alertColorMappingsTransform = createProtectedRegexTransform({
  name: 'alert-color-mappings',
  description: 'Convert alert hardcoded colors to semantic tokens',
  mappings: alertColorMappings,
  changeType: 'alert-color-semantic',

  // Only apply to alert files
  contentFilter: (content) =>
    content.includes('export function Alert') ||
    content.includes('export function AlertTitle') ||
    content.includes('export function AlertDescription') ||
    content.includes('AlertBody') ||
    content.includes('AlertActions'),
})
