/**
 * Table color mapping transform
 *
 * Converts hardcoded zinc colors to semantic tokens in table components
 * Targets border colors that should use semantic border tokens
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js';

const tableColorMappings = makeProtected([
  // Table-specific text hierarchy - preserve header vs body text distinction
  {
    pattern: /\btext-zinc-950\b/g,
    replacement: 'text-table-body-text',
    description: 'Convert zinc-950 text to table body text (primary content)',
  },
  {
    pattern: /\btext-zinc-700\b/g,
    replacement: 'text-table-header-text',
    description: 'Convert zinc-700 text to table header text (secondary hierarchy)',
  },
  {
    pattern: /\btext-zinc-600\b/g,
    replacement: 'text-tertiary-foreground',
    description: 'Convert zinc-600 text to tertiary foreground',
  },
  {
    pattern: /\btext-zinc-500\b/g,
    replacement: 'text-quaternary-foreground',
    description: 'Convert zinc-500 text to quaternary foreground (supporting text)',
  },
  {
    pattern: /\btext-zinc-400\b/g,
    replacement: 'text-muted-foreground',
    description: 'Convert zinc-400 text to muted foreground (least important)',
  },

  // Dark mode text hierarchy
  {
    pattern: /\bdark:text-white\b/g,
    replacement: 'dark:text-table-body-text',
    description: 'Convert dark mode white text to table body text',
  },
  {
    pattern: /\bdark:text-zinc-100\b/g,
    replacement: 'dark:text-table-body-text',
    description: 'Convert dark mode zinc-100 text to table body text',
  },
  {
    pattern: /\bdark:text-zinc-200\b/g,
    replacement: 'dark:text-table-header-text',
    description: 'Convert dark mode zinc-200 text to table header text',
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

  // Border hierarchy with opacity preservation - table-specific patterns
  {
    pattern: /border-b-zinc-950\/10/g,
    replacement: 'border-b-border-subtle',
    description: 'Convert zinc-950/10 bottom borders to subtle border (table header borders)',
  },
  {
    pattern: /border-b-zinc-950\/5/g,
    replacement: 'border-b-border-ghost',
    description: 'Convert zinc-950/5 bottom borders to ghost border (very subtle)',
  },
  {
    pattern: /border-b-zinc-950\/20/g,
    replacement: 'border-b-border',
    description: 'Convert zinc-950/20 bottom borders to standard border',
  },
  {
    pattern: /border-l-zinc-950\/5/g,
    replacement: 'border-l-border-ghost',
    description: 'Convert zinc-950/5 left borders to ghost border (column separators)',
  },
  {
    pattern: /border-l-zinc-950\/10/g,
    replacement: 'border-l-border-subtle',
    description: 'Convert zinc-950/10 left borders to subtle border',
  },
  {
    pattern: /border-r-zinc-950\/5/g,
    replacement: 'border-r-border-ghost',
    description: 'Convert zinc-950/5 right borders to ghost border',
  },

  // Dark mode borders with hierarchy
  {
    pattern: /dark:border-b-white\/10/g,
    replacement: 'dark:border-b-border-subtle',
    description: 'Convert dark mode white/10 bottom borders to subtle border',
  },
  {
    pattern: /dark:border-b-white\/5/g,
    replacement: 'dark:border-b-border-ghost',
    description: 'Convert dark mode white/5 bottom borders to ghost border',
  },
  {
    pattern: /dark:border-b-white\/20/g,
    replacement: 'dark:border-b-border',
    description: 'Convert dark mode white/20 bottom borders to standard border',
  },
  {
    pattern: /dark:border-l-white\/5/g,
    replacement: 'dark:border-l-border-ghost',
    description: 'Convert dark mode white/5 left borders to ghost border',
  },
  {
    pattern: /dark:border-l-white\/10/g,
    replacement: 'dark:border-l-border-subtle',
    description: 'Convert dark mode white/10 left borders to subtle border',
  },

  // General border patterns (fallback)
  {
    pattern: /border-zinc-950\/10/g,
    replacement: 'border-border-subtle',
    description: 'Convert general zinc-950/10 borders to subtle border',
  },
  {
    pattern: /border-zinc-950\/5/g,
    replacement: 'border-border-ghost',
    description: 'Convert general zinc-950/5 borders to ghost border',
  },
  {
    pattern: /dark:border-white\/10/g,
    replacement: 'dark:border-border-subtle',
    description: 'Convert dark mode general white/10 borders to subtle border',
  },
  {
    pattern: /dark:border-white\/5/g,
    replacement: 'dark:border-border-ghost',
    description: 'Convert dark mode general white/5 borders to ghost border',
  },

  // Striped table backgrounds (if any)
  {
    pattern: /bg-zinc-50/g,
    replacement: 'bg-muted/25',
    description: 'Convert light zinc backgrounds to semantic muted with opacity',
  },
  {
    pattern: /dark:bg-zinc-900/g,
    replacement: 'dark:bg-muted/25',
    description: 'Convert dark mode zinc backgrounds to semantic muted with opacity',
  },

  // Hover states
  {
    pattern: /hover:bg-zinc-50/g,
    replacement: 'hover:bg-muted/50',
    description: 'Convert hover zinc backgrounds to semantic muted with opacity',
  },
  {
    pattern: /dark:hover:bg-zinc-900/g,
    replacement: 'dark:hover:bg-muted/50',
    description: 'Convert dark mode hover zinc backgrounds to semantic muted with opacity',
  },
]);

/**
 * Table color mapping transform
 * Converts hardcoded zinc border colors to semantic tokens
 */
export const tableColorMappingsTransform = createProtectedRegexTransform({
  name: 'table-color-mappings',
  description: 'Convert table hardcoded colors to semantic tokens',
  mappings: tableColorMappings,
  changeType: 'table-color-semantic',

  // Only apply to table files
  contentFilter: content =>
    content.includes('export function Table') ||
    content.includes('export function TableHead') ||
    content.includes('export function TableBody') ||
    content.includes('export function TableRow') ||
    content.includes('export function TableHeader') ||
    content.includes('export function TableCell'),
});
