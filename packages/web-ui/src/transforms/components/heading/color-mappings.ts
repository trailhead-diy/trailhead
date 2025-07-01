import {
  createProtectedRegexTransform,
  makeProtected,
} from '../common/utilities/protected-regex-transform-factory.js'

const headingColorMappings = makeProtected([
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
    pattern: /text-zinc-800/,
    replacement: 'text-foreground',
    description: 'Convert zinc-800 text to foreground',
  },
  {
    pattern: /text-zinc-700/,
    replacement: 'text-foreground/90',
    description: 'Convert zinc-700 text to foreground with opacity',
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

  // Dark mode text colors
  {
    pattern: /dark:text-white/,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode white text to foreground',
  },
  {
    pattern: /dark:text-zinc-100/,
    replacement: 'dark:text-foreground',
    description: 'Convert dark mode light zinc text to foreground',
  },
  {
    pattern: /dark:text-zinc-200/,
    replacement: 'dark:text-foreground/90',
    description: 'Convert dark mode zinc-200 text to foreground with opacity',
  },
  {
    pattern: /dark:text-zinc-400/,
    replacement: 'dark:text-muted-foreground',
    description: 'Convert dark mode zinc text to muted',
  },

  // Subheading/secondary text
  {
    pattern: /text-zinc-500/,
    replacement: 'text-muted-foreground',
    description: 'Convert zinc-500 subheading to muted',
  },
  {
    pattern: /text-zinc-600/,
    replacement: 'text-muted-foreground',
    description: 'Convert zinc-600 subheading to muted',
  },
  {
    pattern: /dark:text-zinc-400/,
    replacement: 'dark:text-muted-foreground',
    description: 'Convert dark mode zinc subheading to muted',
  },
])

export const headingColorMappingsTransform = createProtectedRegexTransform({
  name: 'heading-color-mappings',
  description: 'Convert heading hardcoded colors to semantic tokens',
  mappings: headingColorMappings,
  changeType: 'heading-color-semantic',
})
