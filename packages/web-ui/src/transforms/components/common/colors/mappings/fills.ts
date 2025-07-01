/**
 * Fill color mappings - zinc to semantic tokens
 */

import type { ProtectedColorMapping } from '@/transforms/components/common/utilities/protected-regex-transform-factory.js'

/**
 * Get fill color mappings
 * Pure function that returns fill color transformation rules
 */
export function getFillMappings(): ProtectedColorMapping[] {
  return [
    {
      pattern: /fill-zinc-950/g,
      replacement: 'fill-foreground',
      description: 'fill-zinc-950 → fill-foreground (shadcn compatible)',
    },
    {
      pattern: /fill-zinc-900/g,
      replacement: 'fill-foreground',
      description: 'fill-zinc-900 → fill-foreground (shadcn compatible)',
    },
    {
      pattern: /fill-zinc-700/g,
      replacement: 'fill-muted-foreground',
      description: 'fill-zinc-700 → fill-muted-foreground (shadcn compatible)',
    },
    {
      pattern: /fill-zinc-600/g,
      replacement: 'fill-muted-foreground',
      description: 'fill-zinc-600 → fill-muted-foreground (shadcn compatible)',
    },
    {
      pattern: /fill-zinc-500/g,
      replacement: 'fill-muted-foreground',
      description: 'fill-zinc-500 → fill-muted-foreground (shadcn compatible)',
    },
    {
      pattern: /fill-zinc-400/g,
      replacement: 'fill-muted-foreground',
      description: 'fill-zinc-400 → fill-muted-foreground (shadcn compatible)',
    },
    {
      pattern: /fill-white/g,
      replacement: 'fill-foreground',
      description: 'fill-white → fill-foreground (shadcn compatible)',
    },
  ]
}
