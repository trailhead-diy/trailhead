/**
 * Dropdown color mapping transform
 *
 * Converts hardcoded zinc colors to semantic tokens in dropdown components
 * Target: ring-zinc-950/10 dark:ring-ring pattern
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const dropdownColorMappings = makeProtected([
  // Hierarchical text colors - preserve visual hierarchy in dropdown items
  {
    pattern: /text-zinc-950\b/g,
    replacement: 'text-foreground',
    description: 'Convert zinc-950 text to primary foreground (highest contrast)',
  },
  {
    pattern: /text-zinc-900\b/g,
    replacement: 'text-foreground',
    description: 'Convert zinc-900 text to primary foreground',
  },
  {
    pattern: /text-zinc-700\b/g,
    replacement: 'text-secondary-foreground',
    description: 'Convert zinc-700 text to secondary foreground (medium-high contrast)',
  },
  {
    pattern: /text-zinc-600\b/g,
    replacement: 'text-tertiary-foreground',
    description: 'Convert zinc-600 text to tertiary foreground (medium contrast)',
  },
  {
    pattern: /text-zinc-500\b/g,
    replacement: 'text-quaternary-foreground',
    description: 'Convert zinc-500 text to quaternary foreground (lower contrast)',
  },
  {
    pattern: /text-zinc-400\b/g,
    replacement: 'text-muted-foreground',
    description: 'Convert zinc-400 text to muted foreground (lowest contrast)',
  },

  // Dark mode hierarchical text
  {
    pattern: /dark:text-white\b/g,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode white text to primary foreground',
  },
  {
    pattern: /dark:text-zinc-100\b/g,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode zinc-100 text to primary foreground',
  },
  {
    pattern: /dark:text-zinc-200\b/g,
    replacement: 'dark:text-secondary-foreground',
    description: 'Convert dark mode zinc-200 text to secondary foreground',
  },
  {
    pattern: /dark:text-zinc-300\b/g,
    replacement: 'dark:text-tertiary-foreground',
    description: 'Convert dark mode zinc-300 text to tertiary foreground',
  },
  {
    pattern: /dark:text-zinc-400\b/g,
    replacement: 'dark:text-quaternary-foreground',
    description: 'Convert dark mode zinc-400 text to quaternary foreground',
  },
  {
    pattern: /dark:text-zinc-500\b/g,
    replacement: 'dark:text-muted-foreground',
    description: 'Convert dark mode zinc-500 text to muted foreground',
  },

  // Focus and interaction states - preserve data-focus hierarchy
  {
    pattern: /data-focus:bg-zinc-100\b/g,
    replacement: 'data-focus:bg-accent',
    description: 'Convert focus background to semantic accent',
  },
  {
    pattern: /data-focus:text-zinc-950\b/g,
    replacement: 'data-focus:text-foreground',
    description: 'Convert focus text to primary foreground',
  },
  {
    pattern: /dark:data-focus:bg-zinc-800\b/g,
    replacement: 'dark:data-focus:bg-accent',
    description: 'Convert dark mode focus background to semantic accent',
  },
  {
    pattern: /dark:data-focus:text-white\b/g,
    replacement: 'dark:data-focus:text-foreground',
    description: 'Convert dark mode focus text to primary foreground',
  },

  // Icon stroke colors with state preservation
  {
    pattern: /stroke-zinc-500\b/g,
    replacement: 'stroke-icon-inactive',
    description: 'Convert zinc-500 icon strokes to inactive icon token',
  },
  {
    pattern: /stroke-zinc-600\b/g,
    replacement: 'stroke-icon-secondary',
    description: 'Convert zinc-600 icon strokes to secondary icon token',
  },
  {
    pattern: /stroke-zinc-700\b/g,
    replacement: 'stroke-icon-active',
    description: 'Convert zinc-700 icon strokes to active icon token',
  },
  {
    pattern: /dark:stroke-zinc-400\b/g,
    replacement: 'dark:stroke-icon-inactive',
    description: 'Convert dark mode zinc-400 icon strokes to inactive icon token',
  },
  {
    pattern: /dark:stroke-zinc-300\b/g,
    replacement: 'dark:stroke-icon-active',
    description: 'Convert dark mode zinc-300 icon strokes to active icon token',
  },

  // Fill colors for icons
  {
    pattern: /fill-zinc-500\b/g,
    replacement: 'fill-icon-inactive',
    description: 'Convert zinc-500 icon fills to inactive icon token',
  },
  {
    pattern: /fill-zinc-600\b/g,
    replacement: 'fill-icon-secondary',
    description: 'Convert zinc-600 icon fills to secondary icon token',
  },
  {
    pattern: /fill-zinc-700\b/g,
    replacement: 'fill-icon-active',
    description: 'Convert zinc-700 icon fills to active icon token',
  },
  {
    pattern: /dark:fill-zinc-400\b/g,
    replacement: 'dark:fill-icon-inactive',
    description: 'Convert dark mode zinc-400 icon fills to inactive icon token',
  },
  {
    pattern: /dark:fill-zinc-300\b/g,
    replacement: 'dark:fill-icon-active',
    description: 'Convert dark mode zinc-300 icon fills to active icon token',
  },

  // Border hierarchy with opacity preservation
  {
    pattern: /border-zinc-950\/10\b/g,
    replacement: 'border-border-subtle',
    description: 'Convert zinc-950/10 border to subtle border (preserves opacity intent)',
  },
  {
    pattern: /border-zinc-950\/5\b/g,
    replacement: 'border-border-ghost',
    description: 'Convert zinc-950/5 border to ghost border (very subtle)',
  },
  {
    pattern: /border-zinc-950\b/g,
    replacement: 'border-border-strong',
    description: 'Convert zinc-950 border to strong border',
  },
  {
    pattern: /border-zinc-200\b/g,
    replacement: 'border-border',
    description: 'Convert zinc-200 border to standard border',
  },

  // Ring borders with hierarchy
  {
    pattern: /ring-zinc-950\/10\b/g,
    replacement: 'ring-border-subtle',
    description: 'Convert ring zinc-950/10 to subtle ring border',
  },
  {
    pattern: /ring-zinc-950\/20\b/g,
    replacement: 'ring-border',
    description: 'Convert ring zinc-950/20 to standard ring border',
  },
  {
    pattern: /dark:ring-white\/10\b/g,
    replacement: 'dark:ring-border-subtle',
    description: 'Convert dark mode ring white/10 to subtle ring border',
  },
  {
    pattern: /dark:ring-white\/20\b/g,
    replacement: 'dark:ring-border',
    description: 'Convert dark mode ring white/20 to standard ring border',
  },

  // Background colors with hierarchy
  {
    pattern: /bg-zinc-50\b/g,
    replacement: 'bg-muted/50',
    description: 'Convert light zinc-50 backgrounds to semantic muted with opacity',
  },
  {
    pattern: /bg-zinc-100\b/g,
    replacement: 'bg-muted',
    description: 'Convert zinc-100 backgrounds to semantic muted',
  },
  {
    pattern: /dark:bg-zinc-900\b/g,
    replacement: 'dark:bg-muted',
    description: 'Convert dark mode zinc-900 backgrounds to semantic muted',
  },
  {
    pattern: /dark:bg-zinc-800\b/g,
    replacement: 'dark:bg-card',
    description: 'Convert dark mode zinc-800 backgrounds to semantic card',
  },

  // Hover state backgrounds
  {
    pattern: /hover:bg-zinc-100\b/g,
    replacement: 'hover:bg-accent',
    description: 'Convert hover zinc-100 backgrounds to semantic accent',
  },
  {
    pattern: /dark:hover:bg-zinc-800\b/g,
    replacement: 'dark:hover:bg-accent',
    description: 'Convert dark mode hover zinc-800 backgrounds to semantic accent',
  },
])

/**
 * Dropdown color mapping transform
 * Converts hardcoded zinc colors to semantic tokens
 */
export const dropdownColorMappingsTransform = createProtectedRegexTransform({
  name: 'dropdown-color-mappings',
  description: 'Convert dropdown hardcoded colors to semantic tokens',
  mappings: dropdownColorMappings,
  changeType: 'dropdown-color-semantic',

  // Only apply to dropdown files
  contentFilter: (content) =>
    content.includes('export function Dropdown') ||
    content.includes('export function DropdownItem') ||
    content.includes('export function DropdownMenu') ||
    content.includes('DropdownHeading') ||
    content.includes('DropdownDivider'),
})
