/**
 * Text color edge case fixes
 * Handles remaining text color patterns that main transforms might miss
 */

import { createRegexTransform } from '../utilities/regex-transform-factory.js'

/**
 * Text colors edge case transform
 * Created using regex transform factory for DRY implementation
 */
export const textColorsEdgeCaseTransform = createRegexTransform({
  name: 'text-colors-edge-case',
  description: 'Fix remaining text color edge cases',
  mappings: [
    {
      pattern: /\btext-zinc-950\b/g,
      replacement: 'text-foreground',
      description: 'text-zinc-950 → text-foreground',
    },
  ],
  changeType: 'text-color-edge-case',
})
