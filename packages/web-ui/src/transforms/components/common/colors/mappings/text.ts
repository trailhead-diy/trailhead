/**
 * Text color mappings - zinc to semantic tokens
 */

import type { ProtectedColorMapping } from '@/transforms/components/common/utilities/protected-regex-transform-factory.js';

/**
 * Get text color mappings
 * Pure function that returns text color transformation rules
 */
export function getTextMappings(): ProtectedColorMapping[] {
  return [
    {
      pattern: /text-zinc-950\b/g,
      replacement: 'text-foreground',
      description: 'text-zinc-950 → text-foreground (shadcn compatible)',
    },
    {
      pattern: /text-zinc-900\b/g,
      replacement: 'text-foreground',
      description: 'text-zinc-900 → text-foreground (shadcn compatible)',
    },
    {
      pattern: /text-zinc-800\b/g,
      replacement: 'text-foreground',
      description: 'text-zinc-800 → text-foreground (shadcn compatible)',
    },
    {
      pattern: /text-zinc-700\b/g,
      replacement: 'text-muted-foreground',
      description: 'text-zinc-700 → text-muted-foreground (shadcn compatible)',
    },
    {
      pattern: /text-zinc-600\b/g,
      replacement: 'text-muted-foreground',
      description: 'text-zinc-600 → text-muted-foreground (shadcn compatible)',
    },
    {
      pattern: /text-zinc-500\b/g,
      replacement: 'text-muted-foreground',
      description: 'text-zinc-500 → text-muted-foreground (shadcn compatible)',
    },
    {
      pattern: /text-zinc-400\b/g,
      replacement: 'text-muted-foreground',
      description: 'text-zinc-400 → text-muted-foreground (shadcn compatible)',
    },
    {
      pattern: /text-white(?![/])\b/g,
      replacement: 'text-foreground',
      description: 'text-white → text-foreground (shadcn compatible)',
    },
  ];
}
