/**
 * Icon fill edge case fixes
 * Handles icon fill patterns that the main transforms might miss
 */

import { createRegexTransform } from '../utilities/regex-transform-factory.js'

/**
 * Icon fills edge case transform
 * Created using regex transform factory for DRY implementation
 */
export const iconFillsEdgeCaseTransform = createRegexTransform({
  name: 'icon-fills-edge-case',
  description: 'Fix icon fill edge cases',
  mappings: [
    // Light mode icon fills
    {
      pattern: /(?<!dark:)(\*:data-\[slot=icon\]:fill-zinc-950)/g,
      replacement: '*:data-[slot=icon]:fill-foreground',
      description: 'icon fill-zinc-950 → fill-foreground',
    },
    {
      pattern: /(?<!dark:)(\*:data-\[slot=icon\]:fill-zinc-500)/g,
      replacement: '*:data-[slot=icon]:fill-muted-foreground',
      description: 'icon fill-zinc-500 → fill-muted-foreground',
    },
    {
      pattern: /(?<!dark:)(\*:data-\[slot=icon\]:fill-zinc-400)/g,
      replacement: '*:data-[slot=icon]:fill-muted-foreground',
      description: 'icon fill-zinc-400 → fill-muted-foreground',
    },

    // Dark mode icon fills (preserve dark: prefix)
    {
      pattern: /(dark:data-hover:\*:data-\[slot=icon\]:fill-white)/g,
      replacement: 'dark:data-hover:*:data-[slot=icon]:fill-foreground',
      description: 'dark hover icon fill-white → fill-foreground',
    },
    {
      pattern: /(dark:data-active:\*:data-\[slot=icon\]:fill-white)/g,
      replacement: 'dark:data-active:*:data-[slot=icon]:fill-foreground',
      description: 'dark active icon fill-white → fill-foreground',
    },
    {
      pattern: /(dark:data-current:\*:data-\[slot=icon\]:fill-white)/g,
      replacement: 'dark:data-current:*:data-[slot=icon]:fill-foreground',
      description: 'dark current icon fill-white → fill-foreground',
    },
    {
      pattern: /(dark:\*:data-\[slot=icon\]:fill-white)/g,
      replacement: 'dark:*:data-[slot=icon]:fill-foreground',
      description: 'dark icon fill-white → fill-foreground',
    },
    {
      pattern: /(dark:\*:data-\[slot=icon\]:fill-zinc-400)/g,
      replacement: 'dark:*:data-[slot=icon]:fill-muted-foreground',
      description: 'dark icon fill-zinc-400 → fill-muted-foreground',
    },
  ],
  changeType: 'icon-fill-edge-case',
})