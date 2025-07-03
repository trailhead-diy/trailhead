/**
 * Transform to add semantic color definitions to Button component
 * Adds primary, secondary, destructive, accent, and muted color entries
 * to the existing colors object in the Button component
 */

import { createRequire } from 'module';
import { API, FileInfo } from 'jscodeshift';
import { STANDARD_AST_FORMAT_OPTIONS } from '@/transforms/components/common/formatting/ast-options.js';
import type { Transform, TransformResult } from '@/transforms/shared/types.js';

// Create require function for ESM compatibility
const require = createRequire(import.meta.url);

/**
 * Semantic color definitions to add to the Button colors object
 */
const SEMANTIC_COLOR_DEFINITIONS = {
  primary: [
    'text-primary-foreground [--btn-bg:var(--color-primary)] [--btn-border:var(--color-primary)] [--btn-hover-overlay:var(--color-primary-foreground)]/10',
    'dark:text-primary-foreground dark:[--btn-hover-overlay:var(--color-primary-foreground)]/5',
    '[--btn-icon:var(--color-primary-foreground)]/60 data-active:[--btn-icon:var(--color-primary-foreground)]/80 data-hover:[--btn-icon:var(--color-primary-foreground)]/80',
  ],
  secondary: [
    'text-secondary-foreground [--btn-bg:var(--color-secondary)] [--btn-border:var(--color-secondary)] [--btn-hover-overlay:var(--color-secondary-foreground)]/10',
    'dark:text-secondary-foreground dark:[--btn-hover-overlay:var(--color-secondary-foreground)]/5',
    '[--btn-icon:var(--color-secondary-foreground)]/60 data-active:[--btn-icon:var(--color-secondary-foreground)]/80 data-hover:[--btn-icon:var(--color-secondary-foreground)]/80',
  ],
  destructive: [
    'text-destructive-foreground [--btn-bg:var(--color-destructive)] [--btn-border:var(--color-destructive)] [--btn-hover-overlay:var(--color-destructive-foreground)]/10',
    'dark:text-destructive-foreground dark:[--btn-hover-overlay:var(--color-destructive-foreground)]/5',
    '[--btn-icon:var(--color-destructive-foreground)]/60 data-active:[--btn-icon:var(--color-destructive-foreground)]/80 data-hover:[--btn-icon:var(--color-destructive-foreground)]/80',
  ],
  accent: [
    'text-accent-foreground [--btn-bg:var(--color-accent)] [--btn-border:var(--color-accent)] [--btn-hover-overlay:var(--color-accent-foreground)]/10',
    'dark:text-accent-foreground dark:[--btn-hover-overlay:var(--color-accent-foreground)]/5',
    '[--btn-icon:var(--color-accent-foreground)]/60 data-active:[--btn-icon:var(--color-accent-foreground)]/80 data-hover:[--btn-icon:var(--color-accent-foreground)]/80',
  ],
  muted: [
    'text-muted-foreground [--btn-bg:var(--color-muted)] [--btn-border:var(--color-muted)] [--btn-hover-overlay:var(--color-muted-foreground)]/10',
    'dark:text-muted-foreground dark:[--btn-hover-overlay:var(--color-muted-foreground)]/5',
    '[--btn-icon:var(--color-muted-foreground)]/60 data-active:[--btn-icon:var(--color-muted-foreground)]/80 data-hover:[--btn-icon:var(--color-muted-foreground)]/80',
  ],
};

export const buttonAddSemanticColorsTransform: Transform = {
  name: 'button-add-semantic-colors',
  description: 'Add semantic color definitions to Button component colors object',
  type: 'ast',

  execute(content: string): TransformResult {
    const changes: any[] = [];

    // Quick check if this is the Button component
    if (!content.includes('Button') || !content.includes('styles')) {
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

        // Find the styles object with colors property
        root
          .find(j.VariableDeclarator, {
            id: { name: 'styles' },
          })
          .forEach((path: any) => {
            const init = path.value.init;
            if (init?.type !== 'ObjectExpression') return;

            // Find the colors property
            const colorsProperty = init.properties.find(
              (prop: any) =>
                (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
                prop.key.type === 'Identifier' &&
                prop.key.name === 'colors'
            );

            if (!colorsProperty || colorsProperty.value.type !== 'ObjectExpression') return;

            const colorsObject = colorsProperty.value;
            const existingKeys = new Set(
              colorsObject.properties
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

                colorsObject.properties.push(newProperty);

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
        { path: 'button.tsx', source: content },
        { jscodeshift: j, j, stats: () => {}, report: () => {} }
      );

      return {
        content: result,
        changes,
        hasChanges: changes.length > 0,
      };
    } catch (error) {
      console.error('Error in button-add-semantic-colors transform:', error);
      return {
        content,
        changes: [],
        hasChanges: false,
      };
    }
  },
};
