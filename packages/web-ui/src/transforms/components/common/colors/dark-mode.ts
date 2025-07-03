/**
 * Dark mode color mappings
 * Transforms dark: prefixed colors to semantic tokens
 */

import { createRegexTransform, type ColorMapping } from '../utilities/regex-transform-factory.js';

// Dark mode background colors
const DARK_BACKGROUNDS: ColorMapping[] = [
  {
    pattern: /dark:bg-white\/(\d+(?:\.\d+)?)/g,
    replacement: 'dark:bg-muted',
    description: 'dark:bg-white/opacity → dark:bg-muted',
  },
  {
    pattern: /dark:bg-zinc-950/g,
    replacement: 'dark:bg-background',
    description: 'dark:bg-zinc-950 → dark:bg-background',
  },
  {
    pattern: /dark:bg-zinc-900/g,
    replacement: 'dark:bg-card',
    description: 'dark:bg-zinc-900 → dark:bg-card',
  },
  {
    pattern: /dark:bg-zinc-800/g,
    replacement: 'dark:bg-muted',
    description: 'dark:bg-zinc-800 → dark:bg-muted',
  },
];

// Dark mode text colors
const DARK_TEXT: ColorMapping[] = [
  {
    pattern: /dark:text-white\b/g,
    replacement: 'dark:text-foreground',
    description: 'dark:text-white → dark:text-foreground',
  },
  {
    pattern: /dark:text-zinc-400/g,
    replacement: 'dark:text-muted-foreground',
    description: 'dark:text-zinc-400 → dark:text-muted-foreground',
  },
  {
    pattern: /dark:text-zinc-500/g,
    replacement: 'dark:text-muted-foreground',
    description: 'dark:text-zinc-500 → dark:text-muted-foreground',
  },
];

// Dark mode borders
const DARK_BORDERS: ColorMapping[] = [
  {
    pattern: /dark:border-white\/(\d+(?:\.\d+)?)/g,
    replacement: 'dark:border-border',
    description: 'dark:border-white/opacity → dark:border-border',
  },
  {
    pattern: /dark:border-zinc-700/g,
    replacement: 'dark:border-border',
    description: 'dark:border-zinc-700 → dark:border-border',
  },
  {
    pattern: /dark:border-zinc-800/g,
    replacement: 'dark:border-border',
    description: 'dark:border-zinc-800 → dark:border-border',
  },
];

// Dark mode rings
const DARK_RINGS: ColorMapping[] = [
  {
    pattern: /dark:ring-white\/(\d+(?:\.\d+)?)/g,
    replacement: 'dark:ring-ring',
    description: 'dark:ring-white/opacity → dark:ring-ring',
  },
  {
    pattern: /dark:ring-zinc-700/g,
    replacement: 'dark:ring-ring',
    description: 'dark:ring-zinc-700 → dark:ring-ring',
  },
];

// Dark mode fills
const DARK_FILLS: ColorMapping[] = [
  {
    pattern: /dark:fill-white/g,
    replacement: 'dark:fill-foreground',
    description: 'dark:fill-white → dark:fill-foreground',
  },
  {
    pattern: /dark:fill-zinc-400/g,
    replacement: 'dark:fill-muted-foreground',
    description: 'dark:fill-zinc-400 → dark:fill-muted-foreground',
  },
];

// Dark mode icon fills (preserving the dark: prefix)
const DARK_ICON_FILLS: ColorMapping[] = [
  {
    pattern: /dark:\*:data-\[slot=icon\]:fill-white/g,
    replacement: 'dark:*:data-[slot=icon]:fill-foreground',
    description: 'dark:*:data-[slot=icon]:fill-white → dark:*:data-[slot=icon]:fill-foreground',
  },
  {
    pattern: /dark:\*:data-\[slot=icon\]:fill-zinc-400/g,
    replacement: 'dark:*:data-[slot=icon]:fill-muted-foreground',
    description:
      'dark:*:data-[slot=icon]:fill-zinc-400 → dark:*:data-[slot=icon]:fill-muted-foreground',
  },
];

// Dark mode interactive states
const DARK_INTERACTIVE: ColorMapping[] = [
  {
    pattern: /dark:data-hover:bg-white\/(\d+(?:\.\d+)?)/g,
    replacement: 'dark:data-hover:bg-accent',
    description: 'dark:data-hover:bg-white/opacity → dark:data-hover:bg-accent',
  },
  {
    pattern: /dark:data-active:bg-white\/(\d+(?:\.\d+)?)/g,
    replacement: 'dark:data-active:bg-muted',
    description: 'dark:data-active:bg-white/opacity → dark:data-active:bg-muted',
  },
  {
    pattern: /dark:data-focus:ring-white\/(\d+(?:\.\d+)?)/g,
    replacement: 'dark:data-focus:ring-ring',
    description: 'dark:data-focus:ring-white/opacity → dark:data-focus:ring-ring',
  },
];

/**
 * Dark mode color transform
 * Created using regex transform factory for DRY implementation
 */
export const darkModeTransform = createRegexTransform({
  name: 'dark-mode-colors',
  description: 'Transform dark mode colors to semantic tokens',
  mappings: [
    ...DARK_BACKGROUNDS,
    ...DARK_TEXT,
    ...DARK_BORDERS,
    ...DARK_RINGS,
    ...DARK_FILLS,
    ...DARK_ICON_FILLS,
    ...DARK_INTERACTIVE,
  ],
  changeType: 'dark-mode-color',
});
