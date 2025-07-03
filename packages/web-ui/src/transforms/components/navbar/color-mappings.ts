/**
 * Navbar color mapping transform
 *
 * Converts hardcoded colors to semantic tokens in navbar components
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js';

const navbarColorMappings = makeProtected([
  // Icon fills
  {
    pattern: /fill-zinc-500/g,
    replacement: 'fill-muted-foreground',
    description: 'Convert zinc icon fills to semantic muted-foreground',
  },
  {
    pattern: /dark:fill-zinc-400/g,
    replacement: 'dark:fill-muted-foreground',
    description: 'Convert dark mode zinc icon fills to semantic muted-foreground',
  },

  // Hover states for icons
  {
    pattern: /data-hover:\*:data-\[slot=icon\]:fill-zinc-950/g,
    replacement: 'data-hover:*:data-[slot=icon]:fill-foreground',
    description: 'Convert hover state icon fills to semantic foreground',
  },
  {
    pattern: /dark:data-hover:\*:data-\[slot=icon\]:fill-white/g,
    replacement: 'dark:data-hover:*:data-[slot=icon]:fill-foreground',
    description: 'Convert dark mode hover state icon fills to semantic foreground',
  },

  // Active states for icons
  {
    pattern: /data-active:\*:data-\[slot=icon\]:fill-zinc-950/g,
    replacement: 'data-active:*:data-[slot=icon]:fill-foreground',
    description: 'Convert active state icon fills to semantic foreground',
  },
  {
    pattern: /dark:data-active:\*:data-\[slot=icon\]:fill-white/g,
    replacement: 'dark:data-active:*:data-[slot=icon]:fill-foreground',
    description: 'Convert dark mode active state icon fills to semantic foreground',
  },

  // Current indicator
  {
    pattern: /bg-zinc-950/g,
    replacement: 'bg-background',
    description: 'Convert current indicator background to semantic background',
  },
  {
    pattern: /dark:bg-white/g,
    replacement: 'dark:bg-background',
    description: 'Convert dark mode current indicator to semantic background',
  },

  // Divider colors
  {
    pattern: /bg-zinc-950\/5/g,
    replacement: 'bg-foreground/$1',
    description: 'Convert divider color to semantic foreground with opacity',
  },
  {
    pattern: /dark:bg-white\/5/g,
    replacement: 'dark:bg-background/$1',
    description: 'Convert dark mode divider to semantic background with opacity',
  },
]);

/**
 * Navbar color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const navbarColorMappingsTransform = createProtectedRegexTransform({
  name: 'navbar-color-mappings',
  description: 'Convert navbar hardcoded colors to semantic tokens',
  mappings: navbarColorMappings,
  changeType: 'navbar-color-semantic',

  // Only apply to navbar files
  contentFilter: content =>
    content.includes('export function Navbar') ||
    content.includes('export function NavbarItem') ||
    content.includes('export function NavbarDivider') ||
    content.includes('NavbarSection') ||
    content.includes('NavbarLabel'),
});
