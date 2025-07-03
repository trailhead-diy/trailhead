/**
 * Input color mapping transform
 *
 * Converts hardcoded colors to semantic tokens in input components
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js';

const inputColorMappings = makeProtected([
  // Background colors
  {
    pattern: /before:bg-white/g,
    replacement: 'before:bg-background',
    description: 'Convert white pseudo-element backgrounds to semantic background',
  },
  {
    pattern: /dark:bg-muted/g,
    replacement: 'dark:bg-muted',
    description: 'Keep semantic muted background as-is',
  },

  // Text colors
  {
    pattern: /text-foreground/g,
    replacement: 'text-foreground',
    description: 'Keep semantic foreground text as-is',
  },
  {
    pattern: /placeholder:text-zinc-500/g,
    replacement: 'placeholder:text-muted-foreground',
    description: 'Convert zinc placeholder text to semantic muted-foreground',
  },
  {
    pattern: /dark:text-foreground/g,
    replacement: 'dark:text-foreground',
    description: 'Keep dark mode semantic foreground as-is',
  },

  // Border colors
  {
    pattern: /border-zinc-950\/10/g,
    replacement: 'border-border',
    description: 'Convert zinc borders to semantic border token',
  },
  {
    pattern: /data-hover:border-zinc-950\/20/g,
    replacement: 'data-hover:border-border',
    description: 'Convert zinc hover borders to semantic border token',
  },
  {
    pattern: /dark:border-border/g,
    replacement: 'dark:border-border',
    description: 'Keep dark mode semantic border as-is',
  },
  {
    pattern: /dark:data-hover:border-white\/20/g,
    replacement: 'dark:data-hover:border-border',
    description: 'Convert dark mode white hover borders to semantic border',
  },

  // Focus ring colors
  {
    pattern: /after:ring-transparent/g,
    replacement: 'after:ring-transparent',
    description: 'Keep transparent ring as-is for initial state',
  },
  {
    pattern: /sm:focus-within:after:ring-primary/g,
    replacement: 'sm:focus-within:after:ring-primary',
    description: 'Keep semantic primary focus ring as-is',
  },

  // Disabled states
  {
    pattern: /has-data-disabled:before:bg-zinc-950\/5/g,
    replacement: 'has-data-disabled:before:bg-muted/50',
    description: 'Convert zinc disabled backgrounds to semantic muted with opacity',
  },
  {
    pattern: /data-disabled:border-zinc-950\/20/g,
    replacement: 'data-disabled:border-muted',
    description: 'Convert zinc disabled borders to semantic muted',
  },
  {
    pattern: /dark:data-disabled:border-white\/15/g,
    replacement: 'dark:data-disabled:border-muted',
    description: 'Convert dark mode white disabled borders to semantic muted',
  },
  {
    pattern: /dark:data-disabled:bg-white\/2\.5/g,
    replacement: 'dark:data-disabled:bg-muted/10',
    description: 'Convert dark mode white disabled backgrounds to semantic muted with opacity',
  },

  // Invalid states
  {
    pattern: /has-data-invalid:before:shadow-red-500\/10/g,
    replacement: 'has-data-invalid:before:shadow-destructive/10',
    description: 'Convert red invalid shadows to semantic destructive',
  },
  {
    pattern: /data-invalid:border-red-500/g,
    replacement: 'data-invalid:border-destructive',
    description: 'Convert red invalid borders to semantic destructive',
  },
  {
    pattern: /data-invalid:data-hover:border-red-500/g,
    replacement: 'data-invalid:data-hover:border-destructive',
    description: 'Convert red invalid hover borders to semantic destructive',
  },
  {
    pattern: /dark:data-invalid:border-red-500/g,
    replacement: 'dark:data-invalid:border-destructive',
    description: 'Convert dark mode red invalid borders to semantic destructive',
  },
  {
    pattern: /dark:data-invalid:data-hover:border-red-500/g,
    replacement: 'dark:data-invalid:data-hover:border-destructive',
    description: 'Convert dark mode red invalid hover borders to semantic destructive',
  },

  // Icon colors in InputGroup
  {
    pattern: /\*:data-\[slot=icon\]:text-zinc-500/g,
    replacement: '*:data-[slot=icon]:text-muted-foreground',
    description: 'Convert zinc icon colors to semantic muted-foreground',
  },
  {
    pattern: /dark:\*:data-\[slot=icon\]:text-zinc-400/g,
    replacement: 'dark:*:data-[slot=icon]:text-muted-foreground',
    description: 'Convert dark mode zinc icon colors to semantic muted-foreground',
  },
]);

/**
 * Input color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const inputColorMappingsTransform = createProtectedRegexTransform({
  name: 'input-color-mappings',
  description: 'Convert input hardcoded colors to semantic tokens',
  mappings: inputColorMappings,
  changeType: 'input-color-semantic',

  // Only apply to input files
  contentFilter: content =>
    content.includes('export function InputGroup') ||
    content.includes('export const Input') ||
    content.includes('input.tsx'),
});
