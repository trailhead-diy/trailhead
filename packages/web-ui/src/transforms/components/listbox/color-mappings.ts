/**
 * Listbox color mapping transform
 * 
 * Converts hardcoded zinc colors to semantic tokens in listbox components
 * Targets icon strokes and ring borders
 */

import { createProtectedRegexTransform, makeProtected } from '../common/utilities/protected-regex-transform-factory.js'

const listboxColorMappings = makeProtected([
  // Icon stroke colors - primary targets
  {
    pattern: /stroke-zinc-500/g,
    replacement: 'stroke-muted-foreground',
    description: 'Convert zinc icon strokes to semantic muted-foreground'
  },
  {
    pattern: /stroke-zinc-600/g,
    replacement: 'stroke-muted-foreground',
    description: 'Convert zinc icon strokes to semantic muted-foreground'
  },
  {
    pattern: /dark:stroke-zinc-400/g,
    replacement: 'dark:stroke-muted-foreground',
    description: 'Convert dark mode zinc icon strokes to semantic muted-foreground'
  },
  
  // Ring border colors
  {
    pattern: /ring-zinc-950\/10/g,
    replacement: 'ring-border',
    description: 'Convert hardcoded zinc ring borders to semantic border token'
  },
  
  // Disabled state icon colors
  {
    pattern: /group-data-disabled:stroke-zinc-600/g,
    replacement: 'group-data-disabled:stroke-muted-foreground/50',
    description: 'Convert disabled zinc icon strokes to semantic muted with opacity'
  },
  {
    pattern: /dark:group-data-disabled:stroke-zinc-500/g,
    replacement: 'dark:group-data-disabled:stroke-muted-foreground/50',
    description: 'Convert dark mode disabled zinc icon strokes to semantic muted with opacity'
  },
  
  // Selection state colors
  {
    pattern: /data-selected:bg-zinc-100/g,
    replacement: 'data-selected:bg-accent',
    description: 'Convert selected background to semantic accent'
  },
  {
    pattern: /dark:data-selected:bg-zinc-800/g,
    replacement: 'dark:data-selected:bg-accent',
    description: 'Convert dark mode selected background to semantic accent'
  }
])

/**
 * Listbox color mapping transform
 * Converts hardcoded zinc colors to semantic tokens
 */
export const listboxColorMappingsTransform = createProtectedRegexTransform({
  name: 'listbox-color-mappings',
  description: 'Convert listbox hardcoded colors to semantic tokens',
  mappings: listboxColorMappings,
  changeType: 'listbox-color-semantic',
  
  // Only apply to listbox files
  contentFilter: (content) => 
    content.includes('export function Listbox') ||
    content.includes('export function ListboxButton') ||
    content.includes('export function ListboxOptions') ||
    content.includes('export function ListboxOption') ||
    content.includes('ListboxLabel')
})