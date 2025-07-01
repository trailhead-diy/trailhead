/**
 * Special pattern color mappings
 * Handles complex patterns like backdrop-blur combinations and other special cases
 */

import {
  createProtectedRegexTransform,
  type ProtectedColorMapping,
} from '../utilities/protected-regex-transform-factory.js'

// Special combination patterns that need specific handling
const SPECIAL_PATTERNS: ProtectedColorMapping[] = [
  // Backdrop-blur combination patterns
  {
    pattern: /bg-white\/75 backdrop-blur-xl dark:bg-zinc-800\/75/g,
    replacement: 'bg-dialog-overlay/75 backdrop-blur-xl dark:bg-dialog-overlay/90',
    description:
      'bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75 → bg-dialog-overlay/75 backdrop-blur-xl dark:bg-dialog-overlay/90 (modal backdrop)',
  },

  // CSS variable references
  {
    pattern: /var\(--color-zinc-950\)/g,
    replacement: 'var(--color-foreground)',
    description: 'var(--color-zinc-950) → var(--color-foreground)',
  },
  {
    pattern: /var\(--color-zinc-900\)/g,
    replacement: 'var(--color-foreground)',
    description: 'var(--color-zinc-900) → var(--color-foreground)',
  },
  {
    pattern: /var\(--color-zinc-700\)/g,
    replacement: 'var(--color-muted-foreground)',
    description: 'var(--color-zinc-700) → var(--color-muted-foreground)',
  },
  {
    pattern: /var\(--color-zinc-600\)/g,
    replacement: 'var(--color-muted-foreground)',
    description: 'var(--color-zinc-600) → var(--color-muted-foreground)',
  },
  {
    pattern: /var\(--color-zinc-500\)/g,
    replacement: 'var(--color-muted-foreground)',
    description: 'var(--color-zinc-500) → var(--color-muted-foreground)',
  },
  {
    pattern: /var\(--color-zinc-400\)/g,
    replacement: 'var(--color-muted-foreground)',
    description: 'var(--color-zinc-400) → var(--color-muted-foreground)',
  },
  {
    pattern: /var\(--color-white\)/g,
    replacement: 'var(--color-background)',
    description: 'var(--color-white) → var(--color-background)',
  },

  // Selection colors
  {
    pattern: /selection:bg-zinc-900/g,
    replacement: 'selection:bg-primary/20',
    description: 'selection:bg-zinc-900 → selection:bg-primary/20',
  },

  // Scrollbar colors
  {
    pattern: /scrollbar-thumb-zinc-500/g,
    replacement: 'scrollbar-thumb-muted-foreground',
    description: 'scrollbar-thumb-zinc-500 → scrollbar-thumb-muted-foreground',
  },
  {
    pattern: /scrollbar-track-zinc-800/g,
    replacement: 'scrollbar-track-muted',
    description: 'scrollbar-track-zinc-800 → scrollbar-track-muted',
  },
]

/**
 * Special patterns color transform
 * Created using PROTECTED regex transform factory to preserve colors objects
 * This ensures brand colors definitions are not transformed
 */
export const specialPatternsTransform = createProtectedRegexTransform({
  name: 'special-patterns',
  description: 'Transform special color patterns (protected)',
  mappings: SPECIAL_PATTERNS,
  changeType: 'special-pattern',
  globalProtection: true, // Enable protection for style and colors objects
})
