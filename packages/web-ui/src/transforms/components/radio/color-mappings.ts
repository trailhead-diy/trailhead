/**
 * Radio-specific color mappings
 * Transforms radio CSS variables to semantic tokens
 */

import { createProtectedRegexTransform } from '../common/utilities/protected-regex-transform-factory.js';

/**
 * Radio color mappings transform
 * Uses PROTECTED regex transform factory to preserve colors objects
 * This ensures brand color definitions are not transformed
 */
export const radioColorMappingsTransform = createProtectedRegexTransform({
  name: 'radio-color-mappings',
  description: 'Transform radio CSS variables to semantic tokens (protected)',
  mappings: [
    // Only transform zinc colors outside of colors objects
    // The protection mechanism will prevent these from running inside colors definitions
    {
      pattern: /\[--radio-checked-bg:var\(--color-zinc-900\)\]/g,
      replacement: '[--radio-checked-bg:var(--color-primary)]',
      description:
        '[--radio-checked-bg:var(--color-zinc-900)] → [--radio-checked-bg:var(--color-primary)]',
    },
    {
      pattern: /\[--radio-checked-bg:var\(--color-zinc-600\)\]/g,
      replacement: '[--radio-checked-bg:var(--color-primary)]',
      description:
        '[--radio-checked-bg:var(--color-zinc-600)] → [--radio-checked-bg:var(--color-primary)]',
    },
    {
      pattern: /\[--radio-checked-border:var\(--color-zinc-950\)\]/g,
      replacement: '[--radio-checked-border:var(--color-primary)]',
      description:
        '[--radio-checked-border:var(--color-zinc-950)] → [--radio-checked-border:var(--color-primary)]',
    },
  ],
  changeType: 'color-mapping',
  globalProtection: true, // Enable protection for colors objects
});
