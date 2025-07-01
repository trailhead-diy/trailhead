/**
 * Badge color mapping transform
 *
 * Converts hardcoded colors to semantic tokens in badge components
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const badgeColorMappings = makeProtected([
  // Background colors with opacity
  {
    pattern: /bg-red-500\/15/g,
    replacement: 'bg-destructive/15',
    description: 'Convert red backgrounds to semantic destructive with opacity',
  },
  {
    pattern: /bg-green-500\/15/g,
    replacement: 'bg-primary/15',
    description: 'Convert green backgrounds to semantic primary with opacity',
  },
  {
    pattern: /bg-blue-500\/15/g,
    replacement: 'bg-primary/15',
    description: 'Convert blue backgrounds to semantic primary with opacity',
  },
  {
    pattern: /bg-zinc-600\/10/g,
    replacement: 'bg-muted/80',
    description: 'Convert zinc backgrounds to semantic muted with adjusted opacity',
  },

  // Dark mode backgrounds
  {
    pattern: /dark:bg-red-500\/10/g,
    replacement: 'dark:bg-destructive/10',
    description: 'Convert dark mode red to semantic destructive',
  },
  {
    pattern: /dark:bg-muted/g,
    replacement: 'dark:bg-muted',
    description: 'Keep semantic muted token as-is',
  },

  // Text colors
  {
    pattern: /text-red-700/g,
    replacement: 'text-destructive',
    description: 'Convert red text to semantic destructive',
  },
  {
    pattern: /text-green-700/g,
    replacement: 'text-primary',
    description: 'Convert green text to semantic primary',
  },
  {
    pattern: /text-blue-700/g,
    replacement: 'text-primary',
    description: 'Convert blue text to semantic primary',
  },
  {
    pattern: /text-zinc-700/g,
    replacement: 'text-foreground',
    description: 'Convert zinc text to semantic foreground',
  },

  // Dark mode text colors
  {
    pattern: /dark:text-red-400/g,
    replacement: 'dark:text-destructive',
    description: 'Convert dark mode red text to semantic destructive',
  },
  {
    pattern: /dark:text-green-400/g,
    replacement: 'dark:text-primary',
    description: 'Convert dark mode green text to semantic primary',
  },
  {
    pattern: /dark:text-blue-400/g,
    replacement: 'dark:text-primary',
    description: 'Convert dark mode blue text to semantic primary',
  },
  {
    pattern: /dark:text-muted-foreground/g,
    replacement: 'dark:text-muted-foreground',
    description: 'Keep semantic muted-foreground token as-is',
  },

  // Hover states
  {
    pattern: /group-data-hover:bg-red-500\/25/g,
    replacement: 'group-data-hover:bg-destructive/25',
    description: 'Convert red hover backgrounds to semantic destructive',
  },
  {
    pattern: /group-data-hover:bg-green-500\/25/g,
    replacement: 'group-data-hover:bg-primary/25',
    description: 'Convert green hover backgrounds to semantic primary',
  },
  {
    pattern: /group-data-hover:bg-blue-500\/25/g,
    replacement: 'group-data-hover:bg-primary/25',
    description: 'Convert blue hover backgrounds to semantic primary',
  },
  {
    pattern: /group-data-hover:bg-zinc-600\/20/g,
    replacement: 'group-data-hover:bg-accent',
    description: 'Convert zinc hover backgrounds to semantic accent',
  },

  // Dark mode hover states
  {
    pattern: /dark:group-data-hover:bg-red-500\/20/g,
    replacement: 'dark:group-data-hover:bg-destructive/20',
    description: 'Convert dark mode red hover to semantic destructive',
  },
  {
    pattern: /dark:group-data-hover:bg-green-500\/20/g,
    replacement: 'dark:group-data-hover:bg-primary/20',
    description: 'Convert dark mode green hover to semantic primary',
  },
  {
    pattern: /dark:group-data-hover:bg-blue-500\/25/g,
    replacement: 'dark:group-data-hover:bg-primary/25',
    description: 'Convert dark mode blue hover to semantic primary',
  },
  {
    pattern: /dark:group-data-hover:bg-accent/g,
    replacement: 'dark:group-data-hover:bg-accent',
    description: 'Keep semantic accent token as-is',
  },

  // Focus states in BadgeButton
  {
    pattern: /data-focus:outline-primary/g,
    replacement: 'data-focus:outline-primary',
    description: 'Keep semantic primary outline as-is',
  },
])

/**
 * Badge color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const badgeColorMappingsTransform = createProtectedRegexTransform({
  name: 'badge-color-mappings',
  description: 'Convert badge hardcoded colors to semantic tokens',
  mappings: badgeColorMappings,
  changeType: 'badge-color-semantic',

  // Only apply to badge files
  contentFilter: (content) =>
    content.includes('export function Badge') ||
    content.includes('export const BadgeButton') ||
    content.includes('badge.tsx'),
})
