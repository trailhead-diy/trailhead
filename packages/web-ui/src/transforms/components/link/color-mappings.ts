/**
 * Color mapping transform for Link component
 * Maps component-specific color patterns to semantic tokens
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js';

const linkColorMappings = makeProtected([
  // Link doesn't have many hardcoded colors since it's a simple wrapper
  // But let's ensure any future additions are covered

  // Text colors
  {
    pattern: /\btext-zinc-700\b/g,
    replacement: 'text-foreground',
    description: 'Convert zinc-700 text to foreground',
  },
  {
    pattern: /\btext-zinc-500\b/g,
    replacement: 'text-muted-foreground',
    description: 'Convert zinc-500 text to muted-foreground',
  },

  // Hover states
  {
    pattern: /\bhover:text-zinc-900\b/g,
    replacement: 'hover:text-foreground',
    description: 'Convert zinc-900 hover text to foreground',
  },
  {
    pattern: /\bdata-hover:text-zinc-900\b/g,
    replacement: 'data-hover:text-foreground',
    description: 'Convert zinc-900 data-hover text to foreground',
  },

  // Focus states
  {
    pattern: /\bfocus:outline-zinc-950\b/g,
    replacement: 'focus:outline-primary',
    description: 'Convert zinc-950 focus outline to primary',
  },
  {
    pattern: /\bdata-focus:outline-zinc-950\b/g,
    replacement: 'data-focus:outline-primary',
    description: 'Convert zinc-950 data-focus outline to primary',
  },

  // Dark mode patterns
  {
    pattern: /\bdark:text-zinc-400\b/g,
    replacement: 'dark:text-muted-foreground',
    description: 'Convert dark mode zinc-400 text to muted-foreground',
  },
  {
    pattern: /\bdark:text-white\b/g,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode white text to foreground',
  },
  {
    pattern: /\bdark:hover:text-white\b/g,
    replacement: 'dark:hover:text-foreground',
    description: 'Convert dark mode white hover text to foreground',
  },
  {
    pattern: /\bdark:data-hover:text-white\b/g,
    replacement: 'dark:data-hover:text-foreground',
    description: 'Convert dark mode white data-hover text to foreground',
  },
  {
    pattern: /\bdark:focus:outline-white\b/g,
    replacement: 'dark:focus:outline-primary',
    description: 'Convert dark mode white focus outline to primary',
  },
  {
    pattern: /\bdark:data-focus:outline-white\b/g,
    replacement: 'dark:data-focus:outline-primary',
    description: 'Convert dark mode white data-focus outline to primary',
  },
]);

/**
 * Link color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const linkColorMappingsTransform = createProtectedRegexTransform({
  name: 'link-color-mappings',
  description: 'Transform link text colors, hover states, and focus outlines to semantic tokens',
  mappings: linkColorMappings,
  changeType: 'link-color-semantic',

  // Only apply to link component files
  contentFilter: content => content.includes('export const Link = forwardRef'),
});
