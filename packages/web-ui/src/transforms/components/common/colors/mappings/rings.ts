/**
 * Ring color mappings - zinc to semantic tokens
 */

import type { ProtectedColorMapping } from '@/transforms/components/common/utilities/protected-regex-transform-factory.js'

/**
 * Get ring color mappings
 * Pure function that returns ring color transformation rules
 */
export function getRingMappings(): ProtectedColorMapping[] {
  return [
    {
      pattern: /ring-zinc-950\/(\d+(?:\.\d+)?)/g,
      replacement: 'ring-ring',
      description: 'ring-zinc-950/opacity → ring-ring (shadcn compatible)',
    },
    {
      pattern: /ring-white\/(\d+(?:\.\d+)?)/g,
      replacement: 'ring-ring',
      description: 'ring-white/opacity → ring-ring (shadcn compatible)',
    },
    {
      pattern: /ring-zinc-950(?![/])/g,
      replacement: 'ring-ring',
      description: 'ring-zinc-950 → ring-ring (shadcn compatible)',
    },
    {
      pattern: /ring-white(?![/])/g,
      replacement: 'ring-ring',
      description: 'ring-white → ring-ring (shadcn compatible)',
    },
  ]
}
