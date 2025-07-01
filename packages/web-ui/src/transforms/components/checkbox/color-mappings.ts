/**
 * Checkbox-specific color mappings
 * Transforms checkbox CSS variables to semantic tokens
 */

import { createProtectedRegexTransform } from '../common/utilities/protected-regex-transform-factory.js'

/**
 * Checkbox color mappings transform
 * Uses PROTECTED regex transform factory to preserve colors objects
 * This ensures brand color definitions are not transformed
 */
export const checkboxColorMappingsTransform = createProtectedRegexTransform({
  name: 'checkbox-color-mappings',
  description: 'Transform checkbox CSS variables to semantic tokens (protected)',
  mappings: [
    // Only transform zinc colors outside of colors objects
    // The protection mechanism will prevent these from running inside colors definitions
    {
      pattern: /\[--checkbox-checked-bg:var\(--color-zinc-900\)\]/g,
      replacement: '[--checkbox-checked-bg:var(--color-primary)]',
      description:
        '[--checkbox-checked-bg:var(--color-zinc-900)] → [--checkbox-checked-bg:var(--color-primary)]',
    },
    {
      pattern: /\[--checkbox-checked-bg:var\(--color-zinc-600\)\]/g,
      replacement: '[--checkbox-checked-bg:var(--color-primary)]',
      description:
        '[--checkbox-checked-bg:var(--color-zinc-600)] → [--checkbox-checked-bg:var(--color-primary)]',
    },
    {
      pattern: /\[--checkbox-checked-border:var\(--color-zinc-950\)\]/g,
      replacement: '[--checkbox-checked-border:var(--color-primary)]',
      description:
        '[--checkbox-checked-border:var(--color-zinc-950)] → [--checkbox-checked-border:var(--color-primary)]',
    },
  ],
  changeType: 'color-mapping',
  globalProtection: true, // Enable protection for colors objects
})
