import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js';

const authLayoutColorMappings = makeProtected([
  // Background patterns
  {
    pattern: /bg-white/,
    replacement: 'bg-background',
    description: 'Convert white to semantic background',
  },
  {
    pattern: /bg-zinc-50/,
    replacement: 'bg-muted/5',
    description: 'Convert light zinc to muted with opacity',
  },
  {
    pattern: /bg-zinc-100/,
    replacement: 'bg-muted/10',
    description: 'Convert zinc-100 to muted with opacity',
  },
  {
    pattern: /bg-zinc-900/,
    replacement: 'bg-background',
    description: 'Convert dark zinc to background',
  },
  {
    pattern: /bg-zinc-950/,
    replacement: 'bg-background',
    description: 'Convert darkest zinc to background',
  },

  // Text colors
  {
    pattern: /text-zinc-900/,
    replacement: 'text-foreground',
    description: 'Convert dark zinc text to foreground',
  },
  {
    pattern: /text-zinc-950/,
    replacement: 'text-foreground',
    description: 'Convert darkest zinc text to foreground',
  },
  {
    pattern: /text-zinc-600/,
    replacement: 'text-muted-foreground',
    description: 'Convert medium zinc text to muted',
  },
  {
    pattern: /text-zinc-500/,
    replacement: 'text-muted-foreground',
    description: 'Convert zinc-500 text to muted',
  },
  {
    pattern: /text-white/,
    replacement: 'text-background',
    description: 'Convert white text to background',
  },

  // Border colors
  {
    pattern: /border-zinc-200/,
    replacement: 'border-border',
    description: 'Convert light zinc border to semantic',
  },
  {
    pattern: /border-zinc-300/,
    replacement: 'border-border',
    description: 'Convert zinc-300 border to semantic',
  },
  {
    pattern: /border-zinc-950\/10/,
    replacement: 'border-border',
    description: 'Convert zinc border with opacity to semantic',
  },

  // Dark mode patterns
  {
    pattern: /dark:bg-zinc-900/,
    replacement: 'dark:bg-background',
    description: 'Convert dark mode zinc bg to background',
  },
  {
    pattern: /dark:bg-zinc-950/,
    replacement: 'dark:bg-background',
    description: 'Convert darkest zinc bg to background',
  },
  {
    pattern: /dark:bg-white/,
    replacement: 'dark:bg-background',
    description: 'Convert dark mode white bg to background',
  },
  {
    pattern: /dark:text-white/,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode white text to foreground',
  },
  {
    pattern: /dark:text-zinc-400/,
    replacement: 'dark:text-muted-foreground',
    description: 'Convert dark mode zinc text to muted',
  },
  {
    pattern: /dark:border-white\/10/,
    replacement: 'dark:border-border',
    description: 'Convert dark mode white border to semantic',
  },
  {
    pattern: /dark:border-white\/5/,
    replacement: 'dark:border-border',
    description: 'Convert dark mode light border to semantic',
  },

  // Ring colors
  {
    pattern: /ring-zinc-950\/10/,
    replacement: 'ring-ring',
    description: 'Convert zinc ring to semantic',
  },
  {
    pattern: /ring-white\/10/,
    replacement: 'ring-ring',
    description: 'Convert white ring to semantic',
  },

  // Focus states
  {
    pattern: /focus:ring-zinc-950/,
    replacement: 'focus:ring-ring',
    description: 'Convert focus zinc ring to semantic',
  },
  {
    pattern: /focus:ring-white/,
    replacement: 'focus:ring-ring',
    description: 'Convert focus white ring to semantic',
  },

  // Shadow colors
  {
    pattern: /shadow-zinc-950\/5/,
    replacement: 'shadow-border/20',
    description: 'Convert zinc shadow to semantic border shadow',
  },
]);

export const authLayoutColorMappingsTransform = createProtectedRegexTransform({
  name: 'auth-layout-color-mappings',
  description: 'Convert auth layout hardcoded colors to semantic tokens',
  mappings: authLayoutColorMappings,
  changeType: 'auth-layout-color-semantic',
});
