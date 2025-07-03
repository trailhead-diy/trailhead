/**
 * Switch-specific color mappings
 * Transforms switch CSS variables to semantic tokens
 */

import { createProtectedRegexTransform } from '../common/utilities/protected-regex-transform-factory.js';

/**
 * Switch color mappings transform
 * Uses PROTECTED regex transform factory to preserve colors objects
 * This ensures brand color definitions are not transformed
 */
export const switchColorMappingsTransform = createProtectedRegexTransform({
  name: 'switch-color-mappings',
  description: 'Transform switch CSS variables to semantic tokens (protected)',
  mappings: [
    // Only transform zinc colors outside of colors objects
    // The protection mechanism will prevent these from running inside colors definitions
    {
      pattern: /\[--switch-bg:var\(--color-zinc-900\)\]/g,
      replacement: '[--switch-bg:var(--color-primary)]',
      description: '[--switch-bg:var(--color-zinc-900)] → [--switch-bg:var(--color-primary)]',
    },
    {
      pattern: /\[--switch-bg:var\(--color-zinc-600\)\]/g,
      replacement: '[--switch-bg:var(--color-muted)]',
      description: '[--switch-bg:var(--color-zinc-600)] → [--switch-bg:var(--color-muted)]',
    },
    {
      pattern: /\[--switch-bg-ring:var\(--color-zinc-950\)\]/g,
      replacement: '[--switch-bg-ring:var(--color-ring)]',
      description:
        '[--switch-bg-ring:var(--color-zinc-950)] → [--switch-bg-ring:var(--color-ring)]',
    },
    {
      pattern: /\[--switch-ring:var\(--color-zinc-950\)\]/g,
      replacement: '[--switch-ring:var(--color-ring)]',
      description: '[--switch-ring:var(--color-zinc-950)] → [--switch-ring:var(--color-ring)]',
    },
    {
      pattern: /\[--switch-ring:var\(--color-zinc-700\)\]/g,
      replacement: '[--switch-ring:var(--color-ring)]',
      description: '[--switch-ring:var(--color-zinc-700)] → [--switch-ring:var(--color-ring)]',
    },
  ],
  changeType: 'color-mapping',
  globalProtection: true, // Enable protection for colors objects
});
