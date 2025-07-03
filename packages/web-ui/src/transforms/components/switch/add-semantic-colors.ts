/**
 * Transform to add semantic color definitions to Switch component
 * Adds primary, secondary, destructive, accent, and muted color entries
 * to the existing colors object in the Switch component
 */

import { createRequire } from 'module';
import { API, FileInfo } from 'jscodeshift';
import { STANDARD_AST_FORMAT_OPTIONS } from '@/transforms/components/common/formatting/ast-options.js';
import type { Transform, TransformResult } from '@/transforms/shared/types.js';

// Create require function for ESM compatibility
const require = createRequire(import.meta.url);

/**
 * Semantic color definitions to add to the Switch colors object
 * Uses the Switch component's CSS variable pattern:
 * - --switch-bg-ring: Ring color when switch is checked
 * - --switch-bg: Background color when switch is checked
 * - --switch: Color of the switch handle when checked
 * - --switch-ring: Ring color of the switch handle
 * - --switch-shadow: Shadow color of the switch handle
 */
const SEMANTIC_COLOR_DEFINITIONS = {
  primary: [
    '[--switch-bg-ring:var(--color-primary)]/90 [--switch-bg:var(--color-primary)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-primary)]/90 [--switch-shadow:var(--color-primary)]/20',
  ],
  secondary: [
    '[--switch-bg-ring:var(--color-secondary)]/90 [--switch-bg:var(--color-secondary)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-secondary)]/90 [--switch-shadow:var(--color-secondary)]/20',
  ],
  destructive: [
    '[--switch-bg-ring:var(--color-destructive)]/90 [--switch-bg:var(--color-destructive)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-destructive)]/90 [--switch-shadow:var(--color-destructive)]/20',
  ],
  accent: [
    '[--switch-bg-ring:var(--color-accent)]/90 [--switch-bg:var(--color-accent)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-accent)]/90 [--switch-shadow:var(--color-accent)]/20',
  ],
  muted: [
    '[--switch-bg-ring:var(--color-muted-foreground)]/90 [--switch-bg:var(--color-muted-foreground)] dark:[--switch-bg-ring:transparent]',
    '[--switch-shadow:var(--color-black)]/10 [--switch:white] [--switch-ring:var(--color-muted-foreground)]/90',
  ],
};

export const switchAddSemanticColorsTransform: Transform = {
  name: 'switch-add-semantic-colors',
  description: 'Add semantic color definitions to Switch component colors object',
  type: 'ast',

  execute(content: string): TransformResult {
    const changes: any[] = [];

    // Quick check if this is the Switch component
    if (!content.includes('Switch') || !content.includes('colors')) {
      return {
        content,
        changes: [],
        hasChanges: false,
      };
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
      };
    }

    try {
      const jscodeshift = require('jscodeshift');
      const j = jscodeshift.withParser('tsx');

      const transformer = (fileInfo: FileInfo, _api: API) => {
        const root = j(fileInfo.source);

        // Find the colors object
        root
          .find(j.VariableDeclarator, {
            id: { name: 'colors' },
          })
          .forEach((path: any) => {
            const init = path.value.init;
            if (init?.type !== 'ObjectExpression') return;

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
            );

            // Add semantic colors if they don't exist
            Object.entries(SEMANTIC_COLOR_DEFINITIONS).forEach(([colorName, classNames]) => {
              if (!existingKeys.has(colorName)) {
                const arrayExpression = j.arrayExpression(
                  classNames.map(className => j.literal(className))
                );

                const newProperty = j.property('init', j.identifier(colorName), arrayExpression);

                init.properties.push(newProperty);

                changes.push({
                  type: 'semantic-color-added',
                  color: colorName,
                  classes: classNames,
                });
              }
            });
          });

        return root.toSource(STANDARD_AST_FORMAT_OPTIONS);
      };

      const result = transformer(
        { path: 'switch.tsx', source: content },
        { jscodeshift: j, j, stats: () => {}, report: () => {} }
      );

      return {
        content: result,
        changes,
        hasChanges: changes.length > 0,
      };
    } catch (error) {
      console.error('Error in switch-add-semantic-colors transform:', error);
      return {
        content,
        changes: [],
        hasChanges: false,
      };
    }
  },
};
