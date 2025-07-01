/**
 * Button-specific color mappings
 * Transforms button CSS variables from zinc colors to semantic tokens
 */

import { createProtectedRegexTransform } from '../common/utilities/protected-regex-transform-factory.js'

/**
 * Button color mappings transform
 * Created using regex transform factory for DRY implementation
 */
export const buttonColorMappingsTransform = createProtectedRegexTransform({
  name: 'button-color-mappings',
  description:
    'Transform button-specific CSS variables to hierarchical semantic tokens with state preservation',
  mappings: [
    // Icon state mappings with smart fallbacks
    {
      pattern: /\[--btn-icon:var\(--color-zinc-500\)\]/g,
      replacement: '[--btn-icon:var(--icon-inactive,var(--muted-foreground))]',
      description:
        '[--btn-icon:var(--color-zinc-500)] → [--btn-icon:var(--icon-inactive,var(--muted-foreground))] (inactive with fallback)',
    },
    {
      pattern: /\[--btn-icon:var\(--color-zinc-700\)\]/g,
      replacement: '[--btn-icon:var(--icon-active,var(--primary))]',
      description:
        '[--btn-icon:var(--color-zinc-700)] → [--btn-icon:var(--icon-active,var(--primary))] (active with fallback)',
    },
    {
      pattern: /\[--btn-icon:var\(--color-zinc-400\)\]/g,
      replacement: '[--btn-icon:var(--icon-muted,var(--muted))]',
      description:
        '[--btn-icon:var(--color-zinc-400)] → [--btn-icon:var(--icon-muted,var(--muted))] (muted with fallback)',
    },
    {
      pattern: /\[--btn-icon:var\(--color-zinc-300\)\]/g,
      replacement: '[--btn-icon:var(--icon-hover,var(--primary-foreground))]',
      description:
        '[--btn-icon:var(--color-zinc-300)] → [--btn-icon:var(--icon-hover,var(--primary-foreground))] (hover with fallback)',
    },

    // Context-aware icon mappings with fallbacks
    {
      pattern: /data-active:\[--btn-icon:var\(--color-zinc-700\)\]/g,
      replacement: 'data-active:[--btn-icon:var(--icon-active,var(--primary))]',
      description:
        'data-active:[--btn-icon:var(--color-zinc-700)] → data-active:[--btn-icon:var(--icon-active,var(--primary))]',
    },
    {
      pattern: /data-active:\[--btn-icon:var\(--color-zinc-300\)\]/g,
      replacement: 'data-active:[--btn-icon:var(--icon-active,var(--primary))]',
      description:
        'data-active:[--btn-icon:var(--color-zinc-300)] → data-active:[--btn-icon:var(--icon-active,var(--primary))]',
    },
    {
      pattern: /data-hover:\[--btn-icon:var\(--color-zinc-700\)\]/g,
      replacement: 'data-hover:[--btn-icon:var(--icon-hover,var(--primary-foreground))]',
      description:
        'data-hover:[--btn-icon:var(--color-zinc-700)] → data-hover:[--btn-icon:var(--icon-hover,var(--primary-foreground))]',
    },
    {
      pattern: /data-hover:\[--btn-icon:var\(--color-zinc-400\)\]/g,
      replacement: 'data-hover:[--btn-icon:var(--icon-hover,var(--primary-foreground))]',
      description:
        'data-hover:[--btn-icon:var(--color-zinc-400)] → data-hover:[--btn-icon:var(--icon-hover,var(--primary-foreground))]',
    },

    // Dark mode icon mappings with fallbacks
    {
      pattern: /dark:data-active:\[--btn-icon:var\(--color-zinc-400\)\]/g,
      replacement: 'dark:data-active:[--btn-icon:var(--icon-active,var(--primary))]',
      description:
        'dark:data-active:[--btn-icon:var(--color-zinc-400)] → dark:data-active:[--btn-icon:var(--icon-active,var(--primary))]',
    },
    {
      pattern: /dark:data-hover:\[--btn-icon:var\(--color-zinc-400\)\]/g,
      replacement: 'dark:data-hover:[--btn-icon:var(--icon-hover,var(--primary-foreground))]',
      description:
        'dark:data-hover:[--btn-icon:var(--color-zinc-400)] → dark:data-hover:[--btn-icon:var(--icon-hover,var(--primary-foreground))]',
    },

    // Background mappings - no fallbacks needed (required vars)
    {
      pattern: /\[--btn-bg:var\(--color-zinc-900\)\]/g,
      replacement: '[--btn-bg:var(--primary)]',
      description: '[--btn-bg:var(--color-zinc-900)] → [--btn-bg:var(--primary)]',
    },
    {
      pattern: /\[--btn-bg:var\(--color-zinc-800\)\]/g,
      replacement: '[--btn-bg:var(--secondary)]',
      description: '[--btn-bg:var(--color-zinc-800)] → [--btn-bg:var(--secondary)]',
    },
    {
      pattern: /\[--btn-bg:var\(--color-zinc-600\)\]/g,
      replacement: '[--btn-bg:var(--muted)]',
      description: '[--btn-bg:var(--color-zinc-600)] → [--btn-bg:var(--muted)]',
    },

    // Border mappings with fallbacks
    {
      pattern: /\[--btn-border:var\(--color-zinc-950\)\]/g,
      replacement: '[--btn-border:var(--border-strong,var(--border))]',
      description:
        '[--btn-border:var(--color-zinc-950)] → [--btn-border:var(--border-strong,var(--border))]',
    },
    {
      pattern: /\[--btn-border:var\(--color-zinc-900\)\]/g,
      replacement: '[--btn-border:var(--border)]',
      description: '[--btn-border:var(--color-zinc-900)] → [--btn-border:var(--border)]',
    },
    {
      pattern: /\[--btn-border:var\(--color-zinc-200\)\]/g,
      replacement: '[--btn-border:var(--border-subtle,color-mix(in oklch, var(--border) 60%, transparent))]',
      description:
        '[--btn-border:var(--color-zinc-200)] → [--btn-border:var(--border-subtle,lighter border)]',
    },

    // Hover overlay mappings - no fallbacks needed (required vars)
    {
      pattern: /\[--btn-hover-overlay:var\(--color-white\)\]/g,
      replacement: '[--btn-hover-overlay:var(--background)]',
      description:
        '[--btn-hover-overlay:var(--color-white)] → [--btn-hover-overlay:var(--background)]',
    },
    {
      pattern: /\[--btn-hover-overlay:var\(--color-zinc-950\)\]/g,
      replacement: '[--btn-hover-overlay:var(--foreground)]',
      description:
        '[--btn-hover-overlay:var(--color-zinc-950)] → [--btn-hover-overlay:var(--foreground)]',
    },
  ],
  changeType: 'button-color-mapping',
})
