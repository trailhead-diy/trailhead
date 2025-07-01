import { createProtectedRegexTransform, makeProtected } from '../common/utilities/protected-regex-transform-factory.js'

const descriptionListColorMappings = makeProtected([
    // Background colors
    { pattern: /bg-zinc-50/, replacement: 'bg-muted/5', description: 'Convert light zinc bg to muted' },
    { pattern: /bg-zinc-100/, replacement: 'bg-muted/10', description: 'Convert zinc-100 bg to muted' },
    { pattern: /bg-zinc-950\/5/, replacement: 'bg-muted/5', description: 'Convert zinc bg with opacity to muted' },
    { pattern: /bg-white/, replacement: 'bg-background', description: 'Convert white bg to background' },

    // Text colors
    { pattern: /text-zinc-900/, replacement: 'text-foreground', description: 'Convert dark zinc text to foreground' },
    { pattern: /text-zinc-950/, replacement: 'text-foreground', description: 'Convert darkest zinc text to foreground' },
    { pattern: /text-zinc-600/, replacement: 'text-muted-foreground', description: 'Convert medium zinc text to muted' },
    { pattern: /text-zinc-500/, replacement: 'text-muted-foreground', description: 'Convert zinc-500 text to muted' },
    { pattern: /text-white/, replacement: 'text-background', description: 'Convert white text to background' },

    // Border colors
    { pattern: /border-zinc-200/, replacement: 'border-border', description: 'Convert light zinc border to semantic' },
    { pattern: /border-zinc-300/, replacement: 'border-border', description: 'Convert zinc-300 border to semantic' },
    { pattern: /border-zinc-950\/10/, replacement: 'border-border', description: 'Convert zinc border with opacity to semantic' },
    { pattern: /border-zinc-950\/5/, replacement: 'border-border/50', description: 'Convert light zinc border to semantic with opacity' },

    // Divide colors
    { pattern: /divide-zinc-200/, replacement: 'divide-border', description: 'Convert zinc divide to border' },
    { pattern: /divide-zinc-100/, replacement: 'divide-border/50', description: 'Convert light zinc divide to border with opacity' },
    { pattern: /divide-zinc-950\/5/, replacement: 'divide-border/50', description: 'Convert zinc divide with opacity to border' },

    // Dark mode patterns
    { pattern: /dark:bg-zinc-950/, replacement: 'dark:bg-background', description: 'Convert dark mode zinc bg to background' },
    { pattern: /dark:bg-zinc-900/, replacement: 'dark:bg-muted/10', description: 'Convert dark mode zinc bg to muted' },
    { pattern: /dark:bg-white\/5/, replacement: 'dark:bg-muted/5', description: 'Convert dark mode white bg to muted' },
    { pattern: /dark:text-white/, replacement: 'dark:text-foreground', description: 'Convert dark mode white text to foreground' },
    { pattern: /dark:text-zinc-400/, replacement: 'dark:text-muted-foreground', description: 'Convert dark mode zinc text to muted' },
    { pattern: /dark:border-white\/10/, replacement: 'dark:border-border', description: 'Convert dark mode white border to semantic' },
    { pattern: /dark:border-white\/5/, replacement: 'dark:border-border/50', description: 'Convert dark mode light border to semantic with opacity' },
    { pattern: /dark:divide-white\/10/, replacement: 'dark:divide-border', description: 'Convert dark mode white divide to border' },
    { pattern: /dark:divide-white\/5/, replacement: 'dark:divide-border/50', description: 'Convert dark mode light divide to border' },
])

export const descriptionListColorMappingsTransform = createProtectedRegexTransform({
  name: 'description-list-color-mappings',
  description: 'Convert description list hardcoded colors to semantic tokens',
  mappings: descriptionListColorMappings,
  changeType: 'description-list-color-semantic',
})