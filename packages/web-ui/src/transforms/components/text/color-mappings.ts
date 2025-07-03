/**
 * Color mapping transform for Text component
 * Maps component-specific color patterns to semantic tokens
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js';

const textColorMappings = makeProtected([
  // Hierarchical text color patterns - preserve visual hierarchy
  {
    pattern: /\btext-zinc-950\b/g,
    replacement: 'text-foreground',
    description: 'Convert zinc-950 text to primary foreground (highest contrast)',
  },
  {
    pattern: /\btext-zinc-900\b/g,
    replacement: 'text-foreground',
    description: 'Convert zinc-900 text to primary foreground',
  },
  {
    pattern: /\btext-zinc-800\b/g,
    replacement: 'text-secondary-foreground',
    description: 'Convert zinc-800 text to secondary foreground (medium-high contrast)',
  },
  {
    pattern: /\btext-zinc-700\b/g,
    replacement: 'text-secondary-foreground',
    description: 'Convert zinc-700 text to secondary foreground',
  },
  {
    pattern: /\btext-zinc-600\b/g,
    replacement: 'text-tertiary-foreground',
    description: 'Convert zinc-600 text to tertiary foreground (medium contrast)',
  },
  {
    pattern: /\btext-zinc-500\b/g,
    replacement: 'text-quaternary-foreground',
    description: 'Convert zinc-500 text to quaternary foreground (lower contrast)',
  },
  {
    pattern: /\btext-zinc-400\b/g,
    replacement: 'text-muted-foreground',
    description: 'Convert zinc-400 text to muted foreground (lowest contrast)',
  },

  // Border patterns with opacity preservation
  {
    pattern: /\bborder-zinc-950\/10\b/g,
    replacement: 'border-border-subtle',
    description: 'Convert zinc-950/10 border to subtle border (preserves opacity intent)',
  },
  {
    pattern: /\bborder-zinc-950\/5\b/g,
    replacement: 'border-border-ghost',
    description: 'Convert zinc-950/5 border to ghost border (very subtle)',
  },
  {
    pattern: /\bborder-zinc-950\/20\b/g,
    replacement: 'border-border',
    description: 'Convert zinc-950/20 border to standard border',
  },
  {
    pattern: /\bborder-zinc-950\b/g,
    replacement: 'border-border-strong',
    description: 'Convert zinc-950 border to strong border',
  },

  // Background patterns with opacity preservation
  {
    pattern: /\bbg-zinc-950\/2\.5\b/g,
    replacement: 'bg-card/2.5',
    description: 'Convert zinc background to card with opacity',
  },
  {
    pattern: /\bbg-zinc-50\/50\b/g,
    replacement: 'bg-muted/50',
    description: 'Convert zinc-50 background to muted with opacity',
  },

  // TextLink decoration colors
  {
    pattern: /\bdecoration-zinc-950\/50\b/g,
    replacement: 'decoration-foreground/50',
    description: 'Convert zinc decoration to foreground with opacity',
  },
  {
    pattern: /\bdata-hover:decoration-zinc-950\b/g,
    replacement: 'data-hover:decoration-foreground',
    description: 'Convert zinc hover decoration to foreground',
  },

  // Dark mode hierarchical text patterns
  {
    pattern: /\bdark:text-white\b/g,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode white text to primary foreground',
  },
  {
    pattern: /\bdark:text-zinc-100\b/g,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode zinc-100 text to primary foreground',
  },
  {
    pattern: /\bdark:text-zinc-200\b/g,
    replacement: 'dark:text-secondary-foreground',
    description: 'Convert dark mode zinc-200 text to secondary foreground',
  },
  {
    pattern: /\bdark:text-zinc-300\b/g,
    replacement: 'dark:text-tertiary-foreground',
    description: 'Convert dark mode zinc-300 text to tertiary foreground',
  },
  {
    pattern: /\bdark:text-zinc-400\b/g,
    replacement: 'dark:text-quaternary-foreground',
    description: 'Convert dark mode zinc-400 text to quaternary foreground',
  },
  {
    pattern: /\bdark:text-zinc-500\b/g,
    replacement: 'dark:text-muted-foreground',
    description: 'Convert dark mode zinc-500 text to muted foreground',
  },

  // Dark mode border patterns with opacity preservation
  {
    pattern: /\bdark:border-white\/10\b/g,
    replacement: 'dark:border-border-subtle',
    description: 'Convert dark mode white/10 border to subtle border',
  },
  {
    pattern: /\bdark:border-white\/5\b/g,
    replacement: 'dark:border-border-ghost',
    description: 'Convert dark mode white/5 border to ghost border',
  },
  {
    pattern: /\bdark:border-white\/20\b/g,
    replacement: 'dark:border-border',
    description: 'Convert dark mode white/20 border to standard border',
  },
  {
    pattern: /\bdark:border-white\b/g,
    replacement: 'dark:border-border-strong',
    description: 'Convert dark mode white border to strong border',
  },

  // Dark mode background patterns
  {
    pattern: /\bdark:bg-white\/2\.5\b/g,
    replacement: 'dark:bg-background/2.5',
    description: 'Convert dark mode white background to background with opacity',
  },
  {
    pattern: /\bdark:bg-zinc-800\/50\b/g,
    replacement: 'dark:bg-muted/50',
    description: 'Convert dark mode zinc-800 background to muted with opacity',
  },
  {
    pattern: /\bdark:decoration-white\/50\b/g,
    replacement: 'dark:decoration-foreground/50',
    description: 'Convert dark mode white decoration to foreground with opacity',
  },
  {
    pattern: /\bdark:data-hover:decoration-white\b/g,
    replacement: 'dark:data-hover:decoration-foreground',
    description: 'Convert dark mode white hover decoration to foreground',
  },
]);

/**
 * Text color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const textColorMappingsTransform = createProtectedRegexTransform({
  name: 'text-color-mappings',
  description:
    'Transform text colors, code blocks, link decorations, and borders to semantic tokens',
  mappings: textColorMappings,
  changeType: 'text-color-semantic',

  // Only apply to text component files
  contentFilter: content =>
    content.includes('export function Text') ||
    content.includes('export function TextLink') ||
    content.includes('export function Strong') ||
    content.includes('export function Code'),
});
