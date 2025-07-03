/**
 * Transform to add semantic color definitions to Badge component
 * Adds primary, secondary, destructive, accent, and muted color entries
 * to the existing colors object in the Badge component
 */

import { createRequire } from 'module';
import { API, FileInfo } from 'jscodeshift';
import { STANDARD_AST_FORMAT_OPTIONS } from '../common/formatting/ast-options.js';
import type { Transform, TransformResult } from '../../shared/types.js';

// Create require function for ESM compatibility
const require = createRequire(import.meta.url);

/**
 * Semantic color definitions to add to the Badge colors object
 * Uses Badge's pattern of low opacity backgrounds with full opacity text
 */
const SEMANTIC_COLOR_DEFINITIONS = {
  primary:
    'bg-primary/15 text-primary group-data-hover:bg-primary/25 dark:bg-primary/10 dark:text-primary dark:group-data-hover:bg-primary/20',
  secondary:
    'bg-secondary/15 text-secondary group-data-hover:bg-secondary/25 dark:bg-secondary/10 dark:text-secondary dark:group-data-hover:bg-secondary/20',
  destructive:
    'bg-destructive/15 text-destructive group-data-hover:bg-destructive/25 dark:bg-destructive/10 dark:text-destructive dark:group-data-hover:bg-destructive/20',
  accent:
    'bg-accent/20 text-accent-foreground group-data-hover:bg-accent/30 dark:bg-accent/15 dark:text-accent-foreground dark:group-data-hover:bg-accent/25',
  muted:
    'bg-muted/10 text-muted-foreground group-data-hover:bg-muted/20 dark:bg-muted dark:text-muted-foreground dark:group-data-hover:bg-accent',
};

export const badgeAddSemanticColorsTransform: Transform = {
  name: 'badge-add-semantic-colors',
  description: 'Add semantic color definitions to Badge component colors object',
  type: 'ast',

  execute(content: string): TransformResult {
    const changes: any[] = [];

    // Quick check if this is the Badge component
    if (!content.includes('Badge') || !content.includes('colors')) {
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

        // Find the standalone colors object
        root
          .find(j.VariableDeclarator, {
            id: { name: 'colors' },
          })
          .forEach((path: any) => {
            const init = path.value.init;
            if (init?.type !== 'ObjectExpression') return;

            // Check if this is the colors object we want (has color definitions like 'red', 'orange', etc.)
            const hasColorDefinitions = init.properties.some(
              (prop: any) =>
                (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
                prop.key.type === 'Identifier' &&
                ['red', 'orange', 'blue', 'zinc'].includes(prop.key.name)
            );

            if (!hasColorDefinitions) return;

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
            Object.entries(SEMANTIC_COLOR_DEFINITIONS).forEach(([colorName, className]) => {
              if (!existingKeys.has(colorName)) {
                const newProperty = j.property(
                  'init',
                  j.identifier(colorName),
                  j.literal(className)
                );

                init.properties.push(newProperty);

                changes.push({
                  type: 'semantic-color-added',
                  color: colorName,
                  classes: className,
                });
              }
            });
          });

        return root.toSource(STANDARD_AST_FORMAT_OPTIONS);
      };

      const result = transformer(
        { path: 'badge.tsx', source: content },
        { jscodeshift: j, j, stats: () => {}, report: () => {} }
      );

      return {
        content: result,
        changes,
        hasChanges: changes.length > 0,
      };
    } catch (error) {
      console.error('Error in badge-add-semantic-colors transform:', error);
      return {
        content,
        changes: [],
        hasChanges: false,
      };
    }
  },
};
