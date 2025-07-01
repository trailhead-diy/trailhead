/**
 * Select color mapping transform
 * 
 * Converts hardcoded zinc colors to semantic tokens in select components
 * Targets icon stroke colors that should use semantic muted-foreground
 */

import { createProtectedRegexTransform, makeProtected } from '../common/utilities/protected-regex-transform-factory.js'

const selectColorMappings = makeProtected([
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
  
  // Hover and focus states
  {
    pattern: /group-data-hover:stroke-zinc-600/g,
    replacement: 'group-data-hover:stroke-foreground',
    description: 'Convert hover zinc icon strokes to semantic foreground'
  },
  {
    pattern: /dark:group-data-hover:stroke-zinc-300/g,
    replacement: 'dark:group-data-hover:stroke-foreground',
    description: 'Convert dark mode hover zinc icon strokes to semantic foreground'
  },
  
  // Option background colors
  {
    pattern: /bg-zinc-50/g,
    replacement: 'bg-muted/50',
    description: 'Convert light zinc backgrounds to semantic muted with opacity'
  },
  {
    pattern: /dark:bg-zinc-900/g,
    replacement: 'dark:bg-muted/50',
    description: 'Convert dark mode zinc backgrounds to semantic muted with opacity'
  }
])

/**
 * Select color mapping transform
 * Converts hardcoded zinc colors to semantic tokens
 */
export const selectColorMappingsTransform = createProtectedRegexTransform({
  name: 'select-color-mappings',
  description: 'Convert select hardcoded colors to semantic tokens',
  mappings: selectColorMappings,
  changeType: 'select-color-semantic',
  
  // Only apply to select files
  contentFilter: (content) => 
    content.includes('export function Select') ||
    content.includes('export function SelectValue') ||
    content.includes('export function SelectButton')
})