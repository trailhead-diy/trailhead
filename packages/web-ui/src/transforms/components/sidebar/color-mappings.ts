/**
 * Enhanced Color mapping transform for Sidebar component
 * Maps component-specific color patterns to hierarchical semantic tokens
 * Preserves Catalyst UI's careful visual hierarchy in sidebar navigation
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js';

const sidebarColorMappings = makeProtected([
  // Component-specific text hierarchy - use sidebar-specific tokens
  {
    pattern: /\btext-zinc-950\b/g,
    replacement: 'text-sidebar-text-primary',
    description: 'Convert zinc-950 text to sidebar primary text (highest contrast)',
  },
  {
    pattern: /\btext-zinc-700\b/g,
    replacement: 'text-sidebar-text-secondary',
    description: 'Convert zinc-700 text to sidebar secondary text (medium contrast)',
  },
  {
    pattern: /\btext-zinc-600\b/g,
    replacement: 'text-tertiary-foreground',
    description: 'Convert zinc-600 text to tertiary foreground',
  },
  {
    pattern: /\btext-zinc-500\b/g,
    replacement: 'text-quaternary-foreground',
    description: 'Convert zinc-500 text to quaternary foreground',
  },
  {
    pattern: /\btext-zinc-400\b/g,
    replacement: 'text-muted-foreground',
    description: 'Convert zinc-400 text to muted foreground (lowest contrast)',
  },

  // Icon state management with component-specific tokens
  {
    pattern: /\bfill-zinc-500\b/g,
    replacement: 'fill-sidebar-icon-default',
    description: 'Convert zinc-500 fill to sidebar default icon state',
  },
  {
    pattern: /\bfill-zinc-400\b/g,
    replacement: 'fill-icon-muted',
    description: 'Convert zinc-400 fill to muted icon state',
  },
  {
    pattern: /\bdata-hover:fill-zinc-950\b/g,
    replacement: 'data-hover:fill-sidebar-icon-active',
    description: 'Convert zinc-950 hover fill to sidebar active icon state',
  },
  {
    pattern: /\bdata-active:fill-zinc-950\b/g,
    replacement: 'data-active:fill-sidebar-icon-active',
    description: 'Convert zinc-950 active fill to sidebar active icon state',
  },
  {
    pattern: /\bdata-focus:fill-zinc-950\b/g,
    replacement: 'data-focus:fill-sidebar-icon-active',
    description: 'Convert zinc-950 focus fill to sidebar active icon state',
  },

  // Stroke colors for icons
  {
    pattern: /\bstroke-zinc-500\b/g,
    replacement: 'stroke-sidebar-icon-default',
    description: 'Convert zinc-500 stroke to sidebar default icon state',
  },
  {
    pattern: /\bstroke-zinc-400\b/g,
    replacement: 'stroke-icon-muted',
    description: 'Convert zinc-400 stroke to muted icon state',
  },
  {
    pattern: /\bdata-hover:stroke-zinc-950\b/g,
    replacement: 'data-hover:stroke-sidebar-icon-active',
    description: 'Convert zinc-950 hover stroke to sidebar active icon state',
  },
  {
    pattern: /\bdata-active:stroke-zinc-950\b/g,
    replacement: 'data-active:stroke-sidebar-icon-active',
    description: 'Convert zinc-950 active stroke to sidebar active icon state',
  },

  // Border hierarchy with opacity preservation
  {
    pattern: /\bborder-zinc-950\/5\b/g,
    replacement: 'border-border-ghost',
    description: 'Convert zinc-950/5 border to ghost border (very subtle)',
  },
  {
    pattern: /\bborder-zinc-950\/10\b/g,
    replacement: 'border-border-subtle',
    description: 'Convert zinc-950/10 border to subtle border',
  },
  {
    pattern: /\bborder-zinc-950\/20\b/g,
    replacement: 'border-border',
    description: 'Convert zinc-950/20 border to standard border',
  },
  {
    pattern: /\bborder-b-zinc-950\/5\b/g,
    replacement: 'border-b-border-ghost',
    description: 'Convert zinc-950/5 bottom border to ghost border',
  },
  {
    pattern: /\bborder-t-zinc-950\/5\b/g,
    replacement: 'border-t-border-ghost',
    description: 'Convert zinc-950/5 top border to ghost border',
  },

  // Background colors with state hierarchy
  {
    pattern: /\bbg-zinc-950\/5\b/g,
    replacement: 'bg-accent/10',
    description: 'Convert zinc-950/5 background to accent with appropriate opacity',
  },
  {
    pattern: /\bbg-zinc-950\/2\.5\b/g,
    replacement: 'bg-accent/5',
    description: 'Convert zinc-950/2.5 background to very subtle accent',
  },
  {
    pattern: /\bdata-hover:bg-zinc-950\/5\b/g,
    replacement: 'data-hover:bg-accent/15',
    description: 'Convert zinc-950/5 hover background to stronger accent',
  },
  {
    pattern: /\bdata-active:bg-zinc-950\/5\b/g,
    replacement: 'data-active:bg-accent/20',
    description: 'Convert zinc-950/5 active background to strongest accent',
  },
  {
    pattern: /\bdata-focus:bg-zinc-950\/5\b/g,
    replacement: 'data-focus:bg-accent/15',
    description: 'Convert zinc-950/5 focus background to accent',
  },

  // Hover and interaction state text
  {
    pattern: /\bdata-hover:text-zinc-950\b/g,
    replacement: 'data-hover:text-sidebar-text-primary',
    description: 'Convert hover text to sidebar primary text',
  },
  {
    pattern: /\bdata-active:text-zinc-950\b/g,
    replacement: 'data-active:text-sidebar-text-primary',
    description: 'Convert active text to sidebar primary text',
  },
  {
    pattern: /\bdata-focus:text-zinc-950\b/g,
    replacement: 'data-focus:text-sidebar-text-primary',
    description: 'Convert focus text to sidebar primary text',
  },

  // Dark mode patterns
  {
    pattern: /\bdark:border-white\/5\b/g,
    replacement: 'dark:border-border',
    description: 'Convert dark mode white border to semantic border',
  },
  {
    pattern: /\bdark:border-b-white\/5\b/g,
    replacement: 'dark:border-b-border',
    description: 'Convert dark mode white bottom border to semantic border',
  },
  {
    pattern: /\bdark:border-t-white\/5\b/g,
    replacement: 'dark:border-t-border',
    description: 'Convert dark mode white top border to semantic border',
  },
  {
    pattern: /\bdark:bg-white\/2\.5\b/g,
    replacement: 'dark:bg-background/2.5',
    description: 'Convert dark mode white background to background with opacity',
  },
  {
    pattern: /\bdark:data-hover:bg-white\/2\.5\b/g,
    replacement: 'dark:data-hover:bg-background/2.5',
    description: 'Convert dark mode white hover background to background with opacity',
  },
  {
    pattern: /\bdark:data-active:bg-white\/2\.5\b/g,
    replacement: 'dark:data-active:bg-background/2.5',
    description: 'Convert dark mode white active background to background with opacity',
  },
  {
    pattern: /\bdark:text-white\b/g,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode white text to foreground',
  },
  {
    pattern: /\bdark:text-zinc-400\b/g,
    replacement: 'dark:text-muted-foreground',
    description: 'Convert dark mode zinc-400 text to muted-foreground',
  },
  {
    pattern: /\bdark:fill-zinc-500\b/g,
    replacement: 'dark:fill-muted-foreground',
    description: 'Convert dark mode zinc-500 fill to muted-foreground',
  },
  {
    pattern: /\bdark:data-hover:fill-white\b/g,
    replacement: 'dark:data-hover:fill-foreground',
    description: 'Convert dark mode white hover fill to foreground',
  },
  {
    pattern: /\bdark:data-active:fill-white\b/g,
    replacement: 'dark:data-active:fill-foreground',
    description: 'Convert dark mode white active fill to foreground',
  },
]);

/**
 * Sidebar color mapping transform
 * Converts hardcoded colors to semantic tokens
 */
export const sidebarColorMappingsTransform = createProtectedRegexTransform({
  name: 'sidebar-color-mappings',
  description:
    'Transform sidebar borders, backgrounds, text colors, and icon fills to semantic tokens',
  mappings: sidebarColorMappings,
  changeType: 'sidebar-color-semantic',

  // Only apply to sidebar component files
  contentFilter: content =>
    content.includes('export function Sidebar') ||
    content.includes('export function SidebarHeader') ||
    content.includes('export function SidebarBody') ||
    content.includes('export function SidebarItem') ||
    content.includes('export function SidebarSection'),
});
