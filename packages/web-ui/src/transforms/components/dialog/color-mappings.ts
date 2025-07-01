/**
 * Color mapping transform for Dialog component
 * Maps component-specific color patterns to semantic tokens
 */

import { createProtectedRegexTransform, makeProtected } from '../common/utilities/protected-regex-transform-factory.js'

const dialogColorMappings = makeProtected([
    // Background colors
    {
      pattern: /\bbg-zinc-950\/25\b/g,
      replacement: 'bg-card/25',
      description: 'Convert zinc backdrop to card with opacity'
    },
    {
      pattern: /\bbg-white\b/g,
      replacement: 'bg-background',
      description: 'Convert white background to semantic background'
    },
    
    // Ring colors
    {
      pattern: /\bring-1 ring-zinc-950\/10\b/g,
      replacement: 'ring-1 ring-border',
      description: 'Convert zinc ring to semantic border'
    },
    
    // Text colors in DialogTitle
    {
      pattern: /\btext-zinc-950\b/g,
      replacement: 'text-foreground',
      description: 'Convert zinc-950 text to foreground'
    },
    {
      pattern: /\btext-zinc-500\b/g,
      replacement: 'text-muted-foreground',
      description: 'Convert zinc-500 text to muted-foreground'
    },
    
    // Dark mode patterns
    {
      pattern: /\bdark:bg-zinc-950\/50\b/g,
      replacement: 'dark:bg-background/50',
      description: 'Convert dark mode zinc backdrop to background with opacity'
    },
    {
      pattern: /\bdark:bg-zinc-900\b/g,
      replacement: 'dark:bg-card',
      description: 'Convert dark mode zinc-900 to card'
    },
    {
      pattern: /\bdark:ring-white\/10\b/g,
      replacement: 'dark:ring-ring',
      description: 'Convert dark mode white ring to semantic ring'
    },
    {
      pattern: /\bdark:text-white\b/g,
      replacement: 'dark:text-foreground',
      description: 'Convert dark mode white text to foreground'
    },
    {
      pattern: /\bdark:text-zinc-400\b/g,
      replacement: 'dark:text-muted-foreground',
      description: 'Convert dark mode zinc-400 text to muted-foreground'
    }
])

/**
 * Dialog color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const dialogColorMappingsTransform = createProtectedRegexTransform({
  name: 'dialog-color-mappings',
  description: 'Transform dialog backdrop, card backgrounds, borders, and text colors to semantic tokens',
  mappings: dialogColorMappings,
  changeType: 'dialog-color-semantic',
  
  // Only apply to dialog component files
  contentFilter: (content) => 
    content.includes('export function Dialog') ||
    content.includes('export function DialogTitle') ||
    content.includes('export function DialogDescription') ||
    content.includes('export function DialogBody') ||
    content.includes('export function DialogActions')
})