/**
 * Import declaration processing for Catalyst prefix transformations using TypeScript AST
 *
 * Uses TypeScript's native compiler API for reliable AST parsing and transformation,
 * ensuring consistency with other transforms in the codebase.
 *
 * Handles transformation of import statements to use Catalyst prefixes and
 * catalyst- path prefixes. Protects Headless UI imports from any modifications.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Find all ImportDeclaration nodes
 * 3. Skip @headlessui/react imports completely
 * 4. Transform relative import paths to use catalyst- prefix
 * 5. Update import specifier names to use Catalyst prefix
 * 6. Generate transformed code from modified AST using ts.createPrinter
 *
 * Examples of transformations:
 *
 * Import path prefixing:
 * ```tsx
 * import { Link } from './link';
 * // becomes:
 * import { CatalystLink } from './catalyst-link';
 * ```
 *
 * Import specifier prefixing:
 * ```tsx
 * import { Button, Input } from './components';
 * // becomes:
 * import { CatalystButton, CatalystInput } from './catalyst-components';
 * ```
 *
 * Headless UI protection:
 * ```tsx
 * import { Button, ButtonProps } from '@headlessui/react';
 * // Remains unchanged - never transform Headless UI imports
 * ```
 *
 * Multiple specifiers:
 * ```tsx
 * import { Dialog, DialogPanel, DialogTitle } from './dialog';
 * // becomes:
 * import { CatalystDialog, CatalystDialogPanel, CatalystDialogTitle } from './catalyst-dialog';
 * ```
 *
 * Uses TypeScript's compiler API for reliable AST parsing and transformation.
 * Pure functional interface with no classes.
 */

import type { ASTContext } from './core.js';
import ts from 'typescript';

/**
 * Process import declarations and update paths to use catalyst- prefix using TypeScript AST
 *
 * Transform process:
 * 1. Find all ImportDeclaration nodes in the AST
 * 2. Check module specifier values for relative imports
 * 3. Skip @headlessui/react imports to protect Headless UI
 * 4. Transform relative paths to use catalyst- prefix
 * 5. Update import specifier names to include Catalyst prefix
 * 6. Track name mappings for use in other transformation phases
 *
 * Examples:
 * - Transforms `import { Link } from './link'` to `import { CatalystLink } from './catalyst-link'`
 * - Updates `import { Button } from './button'` to `import { CatalystButton } from './catalyst-button'`
 * - Preserves `import { Button } from '@headlessui/react'` unchanged
 * - Handles multiple import specifiers in a single declaration
 */
export function processImportDeclarations(context: ASTContext): ts.SourceFile {
  const { sourceFile, oldToNewMap, changes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 1: Import Declaration Processing with TypeScript AST
  //
  // From:  import { Button, Input } from './components'
  // To:    import { CatalystButton, CatalystInput } from './catalyst-components'
  //
  /////////////////////////////////////////////////////////////////////////////////
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process import declarations
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          const source = node.moduleSpecifier.text;

          // Skip all @headlessui/react imports - never transform them
          if (source === '@headlessui/react') {
            return node;
          }

          // Transform relative imports that don't already have catalyst- prefix
          if (source.startsWith('./') && !source.startsWith('./catalyst-')) {
            const newSource = `./catalyst-${source.slice(2)}`;
            let hasUpdatedSpecifiers = false;
            let updatedSpecifiers: ts.ImportSpecifier[] = [];

            // Update import specifiers if present
            if (
              node.importClause &&
              node.importClause.namedBindings &&
              ts.isNamedImports(node.importClause.namedBindings)
            ) {
              updatedSpecifiers = node.importClause.namedBindings.elements.map(specifier => {
                const importedName = specifier.name.text;

                if (!importedName.startsWith('Catalyst')) {
                  const newName = `Catalyst${importedName}`;
                  oldToNewMap.set(importedName, newName);
                  hasUpdatedSpecifiers = true;

                  return ts.factory.updateImportSpecifier(
                    specifier,
                    false,
                    specifier.propertyName,
                    ts.factory.createIdentifier(newName)
                  );
                }

                return specifier;
              });
            }

            changes.push(`Updated import from ${source} to ${newSource}`);

            // Create updated import declaration
            let updatedImportClause = node.importClause;
            if (
              hasUpdatedSpecifiers &&
              node.importClause &&
              node.importClause.namedBindings &&
              ts.isNamedImports(node.importClause.namedBindings)
            ) {
              updatedImportClause = ts.factory.updateImportClause(
                node.importClause,
                false,
                node.importClause.name,
                ts.factory.updateNamedImports(node.importClause.namedBindings, updatedSpecifiers)
              );
            }

            return ts.factory.updateImportDeclaration(
              node,
              node.modifiers,
              updatedImportClause,
              ts.factory.createStringLiteral(newSource),
              node.assertClause
            );
          }
        }

        return ts.visitEachChild(node, visitNode, transformContext);
      }

      return ts.visitNode(sourceFile, visitNode) as ts.SourceFile;
    };
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];
  result.dispose();

  return transformedSourceFile;
}
