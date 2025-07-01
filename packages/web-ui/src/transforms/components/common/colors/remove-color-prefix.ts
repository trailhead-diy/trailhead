/**
 * Remove --color- prefix from CSS variables
 * Transforms var(--color-*) to var(--*) for semantic tokens
 */

import { createProtectedRegexTransform } from '../utilities/protected-regex-transform-factory.js'

/**
 * Remove --color- prefix transform
 * Ensures CSS variables use the correct naming convention
 */
export const removeColorPrefixTransform = createProtectedRegexTransform({
  name: 'remove-color-prefix',
  description: 'Remove --color- prefix from CSS variables to match theme system',
  mappings: [
    // Basic semantic tokens
    {
      pattern: /var\(--color-background\)/g,
      replacement: 'var(--background)',
      description: 'var(--color-background) → var(--background)',
    },
    {
      pattern: /var\(--color-foreground\)/g,
      replacement: 'var(--foreground)',
      description: 'var(--color-foreground) → var(--foreground)',
    },
    {
      pattern: /var\(--color-primary\)/g,
      replacement: 'var(--primary)',
      description: 'var(--color-primary) → var(--primary)',
    },
    {
      pattern: /var\(--color-primary-foreground\)/g,
      replacement: 'var(--primary-foreground)',
      description: 'var(--color-primary-foreground) → var(--primary-foreground)',
    },
    {
      pattern: /var\(--color-secondary\)/g,
      replacement: 'var(--secondary)',
      description: 'var(--color-secondary) → var(--secondary)',
    },
    {
      pattern: /var\(--color-secondary-foreground\)/g,
      replacement: 'var(--secondary-foreground)',
      description: 'var(--color-secondary-foreground) → var(--secondary-foreground)',
    },
    {
      pattern: /var\(--color-muted\)/g,
      replacement: 'var(--muted)',
      description: 'var(--color-muted) → var(--muted)',
    },
    {
      pattern: /var\(--color-muted-foreground\)/g,
      replacement: 'var(--muted-foreground)',
      description: 'var(--color-muted-foreground) → var(--muted-foreground)',
    },
    {
      pattern: /var\(--color-accent\)/g,
      replacement: 'var(--accent)',
      description: 'var(--color-accent) → var(--accent)',
    },
    {
      pattern: /var\(--color-accent-foreground\)/g,
      replacement: 'var(--accent-foreground)',
      description: 'var(--color-accent-foreground) → var(--accent-foreground)',
    },
    {
      pattern: /var\(--color-destructive\)/g,
      replacement: 'var(--destructive)',
      description: 'var(--color-destructive) → var(--destructive)',
    },
    {
      pattern: /var\(--color-destructive-foreground\)/g,
      replacement: 'var(--destructive-foreground)',
      description: 'var(--color-destructive-foreground) → var(--destructive-foreground)',
    },
    {
      pattern: /var\(--color-border\)/g,
      replacement: 'var(--border)',
      description: 'var(--color-border) → var(--border)',
    },
    {
      pattern: /var\(--color-input\)/g,
      replacement: 'var(--input)',
      description: 'var(--color-input) → var(--input)',
    },
    {
      pattern: /var\(--color-ring\)/g,
      replacement: 'var(--ring)',
      description: 'var(--color-ring) → var(--ring)',
    },

    // Enhanced semantic tokens (optional)
    {
      pattern: /var\(--color-icon-inactive\)/g,
      replacement: 'var(--icon-inactive)',
      description: 'var(--color-icon-inactive) → var(--icon-inactive)',
    },
    {
      pattern: /var\(--color-icon-active\)/g,
      replacement: 'var(--icon-active)',
      description: 'var(--color-icon-active) → var(--icon-active)',
    },
    {
      pattern: /var\(--color-icon-hover\)/g,
      replacement: 'var(--icon-hover)',
      description: 'var(--color-icon-hover) → var(--icon-hover)',
    },
    {
      pattern: /var\(--color-icon-muted\)/g,
      replacement: 'var(--icon-muted)',
      description: 'var(--color-icon-muted) → var(--icon-muted)',
    },
    {
      pattern: /var\(--color-border-strong\)/g,
      replacement: 'var(--border-strong)',
      description: 'var(--color-border-strong) → var(--border-strong)',
    },
    {
      pattern: /var\(--color-border-subtle\)/g,
      replacement: 'var(--border-subtle)',
      description: 'var(--color-border-subtle) → var(--border-subtle)',
    },
    {
      pattern: /var\(--color-border-ghost\)/g,
      replacement: 'var(--border-ghost)',
      description: 'var(--color-border-ghost) → var(--border-ghost)',
    },

    // Component-specific tokens
    {
      pattern: /var\(--color-button-secondary-bg\)/g,
      replacement: 'var(--button-secondary-bg)',
      description: 'var(--color-button-secondary-bg) → var(--button-secondary-bg)',
    },
  ],
  changeType: 'color-prefix-removal',
})
