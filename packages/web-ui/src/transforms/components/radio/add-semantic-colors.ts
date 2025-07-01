/**
 * Transform to add semantic color definitions to Radio component
 * Adds primary, secondary, destructive, accent, and muted color entries
 * to the existing colors object in the Radio component
 */

import { createRequire } from 'module'
import { API, FileInfo } from 'jscodeshift'
import { STANDARD_AST_FORMAT_OPTIONS } from '@/transforms/components/common/formatting/ast-options.js'
import type { Transform, TransformResult } from '@/transforms/shared/types.js'

// Create require function for ESM compatibility
const require = createRequire(import.meta.url)

/**
 * Semantic color definitions to add to the Radio colors object
 * Uses the Radio component's CSS variable pattern:
 * - --radio-checked-indicator: Color of the center dot
 * - --radio-checked-bg: Background color when checked
 * - --radio-checked-border: Border color when checked
 */
const SEMANTIC_COLOR_DEFINITIONS = {
  // Primary uses the same pattern as 'blue' (solid background)
  primary:
    '[--radio-checked-indicator:var(--color-background)] [--radio-checked-bg:var(--color-primary)] [--radio-checked-border:var(--color-primary)]/90',

  // Secondary uses a more subtle pattern like 'zinc'
  secondary:
    '[--radio-checked-indicator:var(--color-background)] [--radio-checked-bg:var(--color-secondary)] [--radio-checked-border:var(--color-secondary)]/90',

  // Destructive uses the same pattern as 'red'
  destructive:
    '[--radio-checked-indicator:var(--color-background)] [--radio-checked-bg:var(--color-destructive)] [--radio-checked-border:var(--color-destructive)]/90',

  // Accent uses a pattern similar to 'violet'
  accent:
    '[--radio-checked-indicator:var(--color-background)] [--radio-checked-bg:var(--color-accent)] [--radio-checked-border:var(--color-accent)]/90',

  // Muted uses the most subtle pattern similar to 'zinc'
  muted:
    '[--radio-checked-indicator:var(--color-background)] [--radio-checked-bg:var(--color-muted-foreground)] [--radio-checked-border:var(--color-muted-foreground)]/90',
}

export const radioAddSemanticColorsTransform: Transform = {
  name: 'radio-add-semantic-colors',
  description: 'Add semantic color definitions to Radio component colors object',
  type: 'ast',

  execute(content: string): TransformResult {
    const changes: any[] = []

    // Quick check if this is the Radio component
    if (!content.includes('Radio') || !content.includes('colors')) {
      return {
        content,
        changes: [],
        hasChanges: false,
      }
    }

    // Skip if semantic colors already exist
    if (
      content.includes('primary:') ||
      content.includes('secondary:') ||
      content.includes('destructive:')
    ) {
      return {
        content,
        changes: [],
        hasChanges: false,
      }
    }

    try {
      const jscodeshift = require('jscodeshift')
      const j = jscodeshift.withParser('tsx')

      const transformer = (fileInfo: FileInfo, _api: API) => {
        const root = j(fileInfo.source)

        // Find the colors object
        root
          .find(j.VariableDeclarator, {
            id: { name: 'colors' },
          })
          .forEach((path: any) => {
            const init = path.value.init
            if (init?.type !== 'ObjectExpression') return

            const existingKeys = new Set(
              init.properties
                .filter((prop: any) => prop.type === 'Property' || prop.type === 'ObjectProperty')
                .map((prop: any) =>
                  prop.key.type === 'Identifier'
                    ? prop.key.name
                    : prop.key.type === 'Literal'
                      ? String(prop.key.value)
                      : ''
                )
                .filter(Boolean)
            )

            // Add semantic colors if they don't exist
            Object.entries(SEMANTIC_COLOR_DEFINITIONS).forEach(([colorName, className]) => {
              if (!existingKeys.has(colorName)) {
                const newProperty = j.property(
                  'init',
                  j.identifier(colorName),
                  j.literal(className)
                )

                // Find the best position to insert (after 'rose' if it exists, otherwise at the end)
                const roseIndex = init.properties.findIndex(
                  (prop: any) =>
                    (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
                    prop.key.type === 'Identifier' &&
                    prop.key.name === 'rose'
                )

                if (roseIndex !== -1) {
                  // Insert after 'rose'
                  init.properties.splice(roseIndex + 1, 0, newProperty)
                } else {
                  // Add at the end
                  init.properties.push(newProperty)
                }

                changes.push({
                  type: 'semantic-color-added',
                  color: colorName,
                  classes: className,
                })
              }
            })
          })

        // Type update is handled by a separate transform to avoid AST complexity

        return root.toSource(STANDARD_AST_FORMAT_OPTIONS)
      }

      const result = transformer(
        { path: 'radio.tsx', source: content },
        { jscodeshift: j, j, stats: () => {}, report: () => {} }
      )

      return {
        content: result,
        changes,
        hasChanges: changes.length > 0,
      }
    } catch (error) {
      console.error('Error in radio-add-semantic-colors transform:', error)
      return {
        content,
        changes: [],
        hasChanges: false,
      }
    }
  },
}

// Export for use in transform pipelines
export default {
  name: 'add-semantic-colors-radio',
  transform: radioAddSemanticColorsTransform,
  description:
    'Adds semantic color definitions (primary, secondary, destructive, accent, muted) to Radio component',
}
