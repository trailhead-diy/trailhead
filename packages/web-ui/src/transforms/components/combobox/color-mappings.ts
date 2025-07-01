/**
 * Combobox color mapping transform
 *
 * Converts hardcoded zinc colors to semantic tokens in combobox components
 * Targets multiple zinc color patterns including icons and borders
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const comboboxColorMappings = makeProtected([
  // Icon stroke colors - primary targets
  {
    pattern: /stroke-zinc-500/g,
    replacement: 'stroke-muted-foreground',
    description: 'Convert zinc icon strokes to semantic muted-foreground',
  },
  {
    pattern: /stroke-zinc-600/g,
    replacement: 'stroke-muted-foreground',
    description: 'Convert zinc icon strokes to semantic muted-foreground',
  },
  {
    pattern: /dark:stroke-zinc-400/g,
    replacement: 'dark:stroke-muted-foreground',
    description: 'Convert dark mode zinc icon strokes to semantic muted-foreground',
  },
  {
    pattern: /dark:stroke-zinc-300/g,
    replacement: 'dark:stroke-muted-foreground',
    description: 'Convert dark mode zinc icon strokes to semantic muted-foreground',
  },

  // Ring border colors
  {
    pattern: /ring-zinc-950\/10/g,
    replacement: 'ring-border',
    description: 'Convert hardcoded zinc ring borders to semantic border token',
  },

  // Disabled state icon colors
  {
    pattern: /group-data-disabled:stroke-zinc-600/g,
    replacement: 'group-data-disabled:stroke-muted-foreground/50',
    description: 'Convert disabled zinc icon strokes to semantic muted with opacity',
  },
  {
    pattern: /dark:group-data-disabled:stroke-zinc-500/g,
    replacement: 'dark:group-data-disabled:stroke-muted-foreground/50',
    description: 'Convert dark mode disabled zinc icon strokes to semantic muted with opacity',
  },

  // Hover state icon colors
  {
    pattern: /group-data-hover:stroke-zinc-600/g,
    replacement: 'group-data-hover:stroke-foreground',
    description: 'Convert hover zinc icon strokes to semantic foreground',
  },
  {
    pattern: /dark:group-data-hover:stroke-zinc-300/g,
    replacement: 'dark:group-data-hover:stroke-foreground',
    description: 'Convert dark mode hover zinc icon strokes to semantic foreground',
  },
])

/**
 * Combobox color mapping transform
 * Converts hardcoded zinc colors to semantic tokens
 */
export const comboboxColorMappingsTransform = createProtectedRegexTransform({
  name: 'combobox-color-mappings',
  description: 'Convert combobox hardcoded colors to semantic tokens',
  mappings: comboboxColorMappings,
  changeType: 'combobox-color-semantic',

  // Only apply to combobox files
  contentFilter: (content) =>
    content.includes('export function Combobox') ||
    content.includes('export function ComboboxInput') ||
    content.includes('export function ComboboxButton') ||
    content.includes('export function ComboboxOptions') ||
    content.includes('ComboboxOption'),
})
