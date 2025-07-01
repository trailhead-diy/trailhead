/**
 * Add fallbacks to enhanced semantic tokens
 * Transforms enhanced tokens to include fallback chains for shadcn compatibility
 */

import { createProtectedRegexTransform } from '../utilities/protected-regex-transform-factory.js'

/**
 * Add fallbacks to enhanced semantic tokens
 * Ensures components work with both basic shadcn themes and enhanced themes
 */
export const addEnhancedFallbacksTransform = createProtectedRegexTransform({
  name: 'add-enhanced-fallbacks',
  description: 'Add fallback chains to enhanced semantic tokens',
  mappings: [
    // Hierarchical text tokens
    {
      pattern: /\btext-tertiary-foreground\b/g,
      replacement: 'text-[color:var(--tertiary-foreground,color-mix(in_oklch,var(--foreground)_70%,transparent))]',
      description: 'Add fallback to tertiary-foreground (70% foreground)',
    },
    {
      pattern: /\btext-quaternary-foreground\b/g,
      replacement: 'text-[color:var(--quaternary-foreground,color-mix(in_oklch,var(--foreground)_50%,transparent))]',
      description: 'Add fallback to quaternary-foreground (50% foreground)',
    },
    
    // Icon state tokens - stroke
    {
      pattern: /\bstroke-icon-primary\b/g,
      replacement: 'stroke-[var(--icon-primary,var(--primary))]',
      description: 'Add fallback to icon-primary stroke',
    },
    {
      pattern: /\bstroke-icon-secondary\b/g,
      replacement: 'stroke-[var(--icon-secondary,var(--secondary-foreground))]',
      description: 'Add fallback to icon-secondary stroke',
    },
    {
      pattern: /\bstroke-icon-inactive\b/g,
      replacement: 'stroke-[var(--icon-inactive,var(--muted-foreground))]',
      description: 'Add fallback to icon-inactive stroke',
    },
    {
      pattern: /\bstroke-icon-active\b/g,
      replacement: 'stroke-[var(--icon-active,var(--primary))]',
      description: 'Add fallback to icon-active stroke',
    },
    {
      pattern: /\bstroke-icon-hover\b/g,
      replacement: 'stroke-[var(--icon-hover,var(--primary-foreground))]',
      description: 'Add fallback to icon-hover stroke',
    },
    {
      pattern: /\bstroke-icon-muted\b/g,
      replacement: 'stroke-[var(--icon-muted,var(--muted))]',
      description: 'Add fallback to icon-muted stroke',
    },
    
    // Icon state tokens - fill
    {
      pattern: /\bfill-icon-primary\b/g,
      replacement: 'fill-[var(--icon-primary,var(--primary))]',
      description: 'Add fallback to icon-primary fill',
    },
    {
      pattern: /\bfill-icon-secondary\b/g,
      replacement: 'fill-[var(--icon-secondary,var(--secondary-foreground))]',
      description: 'Add fallback to icon-secondary fill',
    },
    {
      pattern: /\bfill-icon-inactive\b/g,
      replacement: 'fill-[var(--icon-inactive,var(--muted-foreground))]',
      description: 'Add fallback to icon-inactive fill',
    },
    {
      pattern: /\bfill-icon-active\b/g,
      replacement: 'fill-[var(--icon-active,var(--primary))]',
      description: 'Add fallback to icon-active fill',
    },
    {
      pattern: /\bfill-icon-hover\b/g,
      replacement: 'fill-[var(--icon-hover,var(--primary-foreground))]',
      description: 'Add fallback to icon-hover fill',
    },
    {
      pattern: /\bfill-icon-muted\b/g,
      replacement: 'fill-[var(--icon-muted,var(--muted))]',
      description: 'Add fallback to icon-muted fill',
    },
    
    // Border weight tokens
    {
      pattern: /\bborder-border-strong\b/g,
      replacement: 'border-[color:var(--border-strong,var(--border))]',
      description: 'Add fallback to border-strong',
    },
    {
      pattern: /\bborder-border-subtle\b/g,
      replacement: 'border-[color:var(--border-subtle,color-mix(in_oklch,var(--border)_60%,transparent))]',
      description: 'Add fallback to border-subtle (60% border)',
    },
    {
      pattern: /\bborder-border-ghost\b/g,
      replacement: 'border-[color:var(--border-ghost,color-mix(in_oklch,var(--border)_30%,transparent))]',
      description: 'Add fallback to border-ghost (30% border)',
    },
    
    // Ring weight tokens
    {
      pattern: /\bring-border-subtle\b/g,
      replacement: 'ring-[color:var(--border-subtle,color-mix(in_oklch,var(--ring)_60%,transparent))]',
      description: 'Add fallback to ring border-subtle',
    },
    
    // Component-specific tokens
    {
      pattern: /\btext-sidebar-text-primary\b/g,
      replacement: 'text-[color:var(--sidebar-text-primary,var(--sidebar-foreground))]',
      description: 'Add fallback to sidebar-text-primary',
    },
    {
      pattern: /\btext-sidebar-text-secondary\b/g,
      replacement: 'text-[color:var(--sidebar-text-secondary,var(--muted-foreground))]',
      description: 'Add fallback to sidebar-text-secondary',
    },
    {
      pattern: /\btext-table-header-text\b/g,
      replacement: 'text-[color:var(--table-header-text,var(--muted-foreground))]',
      description: 'Add fallback to table-header-text',
    },
    {
      pattern: /\btext-table-body-text\b/g,
      replacement: 'text-[color:var(--table-body-text,var(--foreground))]',
      description: 'Add fallback to table-body-text',
    },
    
    // Dark mode variations
    {
      pattern: /\bdark:text-tertiary-foreground\b/g,
      replacement: 'dark:text-[color:var(--tertiary-foreground,color-mix(in_oklch,var(--foreground)_70%,transparent))]',
      description: 'Add fallback to dark tertiary-foreground',
    },
    {
      pattern: /\bdark:text-quaternary-foreground\b/g,
      replacement: 'dark:text-[color:var(--quaternary-foreground,color-mix(in_oklch,var(--foreground)_50%,transparent))]',
      description: 'Add fallback to dark quaternary-foreground',
    },
    {
      pattern: /\bdark:stroke-icon-inactive\b/g,
      replacement: 'dark:stroke-[var(--icon-inactive,var(--muted-foreground))]',
      description: 'Add fallback to dark icon-inactive stroke',
    },
    {
      pattern: /\bdark:stroke-icon-active\b/g,
      replacement: 'dark:stroke-[var(--icon-active,var(--primary))]',
      description: 'Add fallback to dark icon-active stroke',
    },
    {
      pattern: /\bdark:fill-icon-inactive\b/g,
      replacement: 'dark:fill-[var(--icon-inactive,var(--muted-foreground))]',
      description: 'Add fallback to dark icon-inactive fill',
    },
    {
      pattern: /\bdark:fill-icon-active\b/g,
      replacement: 'dark:fill-[var(--icon-active,var(--primary))]',
      description: 'Add fallback to dark icon-active fill',
    },
    {
      pattern: /\bdark:ring-border-subtle\b/g,
      replacement: 'dark:ring-[color:var(--border-subtle,color-mix(in_oklch,var(--ring)_60%,transparent))]',
      description: 'Add fallback to dark ring border-subtle',
    },
  ],
  changeType: 'enhanced-fallback',
})