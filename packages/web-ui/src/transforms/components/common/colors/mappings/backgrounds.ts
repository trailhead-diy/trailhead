/**
 * Background color mappings - zinc to semantic tokens
 */

import type { ProtectedColorMapping } from '@/transforms/components/common/utilities/protected-regex-transform-factory.js';

/**
 * Get background color mappings
 * Pure function that returns background color transformation rules
 */
export function getBackgroundMappings(): ProtectedColorMapping[] {
  return [
    {
      pattern: /bg-zinc-950/g,
      replacement: 'bg-card',
      description: 'bg-zinc-950 → bg-card (shadcn compatible)',
    },
    {
      pattern: /bg-zinc-900/g,
      replacement: 'bg-card',
      description: 'bg-zinc-900 → bg-card (shadcn compatible)',
    },
    {
      pattern: /bg-zinc-800/g,
      replacement: 'bg-muted',
      description: 'bg-zinc-800 → bg-muted (shadcn compatible)',
    },
    {
      pattern: /bg-zinc-700/g,
      replacement: 'bg-muted',
      description: 'bg-zinc-700 → bg-muted (shadcn compatible)',
    },
    {
      pattern: /bg-zinc-200/g,
      replacement: 'bg-accent',
      description: 'bg-zinc-200 → bg-accent (shadcn compatible)',
    },
    {
      pattern: /bg-zinc-100/g,
      replacement: 'bg-accent',
      description: 'bg-zinc-100 → bg-accent (shadcn compatible)',
    },
    {
      pattern: /bg-white(?![/])/g,
      replacement: 'bg-background',
      description: 'bg-white → bg-background (shadcn compatible)',
    },
    // Opacity-based backgrounds - preserve semantic intent
    {
      pattern: /bg-zinc-950\/(\d+(?:\.\d+)?)/g,
      replacement: 'bg-foreground/$1',
      description: 'bg-zinc-950/opacity → bg-foreground/opacity (preserve opacity)',
    },
    {
      pattern: /bg-white\/(\d+(?:\.\d+)?)/g,
      replacement: 'bg-background/$1',
      description: 'bg-white/opacity → bg-background/opacity (preserve opacity)',
    },
  ];
}
