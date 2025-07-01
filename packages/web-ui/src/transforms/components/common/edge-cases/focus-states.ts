/**
 * Focus states edge case fixes
 * Handles focus-related patterns that main transforms might miss
 */

import { createRegexTransform } from '../utilities/regex-transform-factory.js'

/**
 * Focus states edge case transform
 * Created using regex transform factory for DRY implementation
 */
export const focusStatesEdgeCaseTransform = createRegexTransform({
  name: 'focus-states-edge-case',
  description: 'Fix focus state edge cases',
  mappings: [
    {
      pattern: /data-focus:ring-zinc-950\/(\d+(?:\.\d+)?)/g,
      replacement: 'data-focus:ring-primary/20',
      description: 'data-focus:ring-zinc-950/opacity → data-focus:ring-primary/20',
    },
    {
      pattern: /data-focus:ring-black\/(\d+(?:\.\d+)?)/g,
      replacement: 'data-focus:ring-muted/50',
      description: 'data-focus:ring-black/opacity → data-focus:ring-muted/50',
    },
    {
      pattern: /data-disabled:ring-black\/(\d+(?:\.\d+)?)/g,
      replacement: 'data-disabled:ring-muted/50',
      description: 'data-disabled:ring-black/opacity → data-disabled:ring-muted/50',
    },
  ],
  changeType: 'focus-state-edge-case',
})