/**
 * Blue to primary edge case fixes
 * Converts interactive blue colors to primary theme color
 */

import { createRegexTransform } from '../utilities/regex-transform-factory.js'

/**
 * Blue to primary edge case transform
 * Created using regex transform factory for DRY implementation
 */
export const blueToPrimaryEdgeCaseTransform = createRegexTransform({
  name: 'blue-to-primary-edge-case',
  description: 'Convert blue interactive colors to primary',
  mappings: [
    {
      pattern: /\bring-blue-500\b/g,
      replacement: 'ring-primary',
      description: 'ring-blue-500 → ring-primary',
    },
    {
      pattern: /\boutline-blue-500\b/g,
      replacement: 'outline-primary',
      description: 'outline-blue-500 → outline-primary',
    },
    {
      pattern: /data-focus:bg-blue-500/g,
      replacement: 'data-focus:bg-primary',
      description: 'data-focus:bg-blue-500 → data-focus:bg-primary',
    },
    {
      pattern: /data-focus:outline-blue-500/g,
      replacement: 'data-focus:outline-primary',
      description: 'data-focus:outline-blue-500 → data-focus:outline-primary',
    },
    {
      pattern: /sm:focus-within:after:ring-blue-500/g,
      replacement: 'sm:focus-within:after:ring-primary',
      description: 'sm:focus-within:after:ring-blue-500 → sm:focus-within:after:ring-primary',
    },
    {
      pattern: /focus-within:after:ring-blue-500/g,
      replacement: 'focus-within:after:ring-primary',
      description: 'focus-within:after:ring-blue-500 → focus-within:after:ring-primary',
    },
    {
      pattern: /has-\[\[data-row-link\]\[data-focus\]\]:outline-blue-500/g,
      replacement: 'has-[[data-row-link][data-focus]]:outline-primary',
      description: 'table row focus outline-blue-500 → outline-primary',
    },
  ],
  changeType: 'blue-to-primary-edge-case',
})