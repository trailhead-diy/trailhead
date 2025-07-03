/**
 * Border color mappings - zinc to semantic tokens
 */

import type { ProtectedColorMapping } from '@/transforms/components/common/utilities/protected-regex-transform-factory.js';

/**
 * Get border color mappings
 * Pure function that returns border color transformation rules
 */
export function getBorderMappings(): ProtectedColorMapping[] {
  return [
    {
      pattern: /border-zinc-950\/(\d+(?:\.\d+)?)/g,
      replacement: 'border-border',
      description: 'border-zinc-950/opacity → border-border (shadcn compatible)',
    },
    {
      pattern: /border-zinc-200/g,
      replacement: 'border-border',
      description: 'border-zinc-200 → border-border (shadcn compatible)',
    },
    {
      pattern: /border-white\/(\d+(?:\.\d+)?)/g,
      replacement: 'border-border',
      description: 'border-white/opacity → border-border (shadcn compatible)',
    },
  ];
}
