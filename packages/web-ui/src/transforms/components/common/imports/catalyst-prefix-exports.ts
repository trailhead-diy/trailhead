/**
 * Transform: Catalyst Prefix Exports
 * Only handles renaming exports to add Catalyst prefix
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js';
import type { JSCodeshift, Collection } from 'jscodeshift';

function transformCatalystPrefixExports(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = [];
  console.log('=== Running catalyst-prefix-exports transform ===');

  // Update export function declarations or export const XXX = forwardRef( to include Catalyst prefix
  console.log('Looking for export declarations...');
  root.find(j.ExportNamedDeclaration).forEach(exportDecl => {
    console.log('Found export declaration:', exportDecl.node);

    if (exportDecl.node.declaration) {
      let funcName: string | undefined;

      if (j.FunctionDeclaration.check(exportDecl.node.declaration)) {
        funcName = exportDecl.node.declaration.id?.name.toString();
        console.log('Found function declaration:', funcName);
      } else if (j.VariableDeclaration.check(exportDecl.node.declaration)) {
        const firstDeclarator = exportDecl.node.declaration.declarations[0];
        if (
          firstDeclarator &&
          j.VariableDeclarator.check(firstDeclarator) &&
          j.Identifier.check(firstDeclarator.id)
        ) {
          funcName = firstDeclarator.id.name.toString();
          console.log('Found variable declaration:', funcName);
        }
      }

      if (funcName && !funcName.startsWith('Catalyst') && !funcName.startsWith('TouchTarget')) {
        console.log(`Processing function: ${funcName}`);

        if (j.FunctionDeclaration.check(exportDecl.node.declaration)) {
          exportDecl.node.declaration.id!.name = `Catalyst${funcName}`;
        } else if (j.VariableDeclaration.check(exportDecl.node.declaration)) {
          const firstDeclarator = exportDecl.node.declaration.declarations[0];
          if (
            firstDeclarator &&
            j.VariableDeclarator.check(firstDeclarator) &&
            j.Identifier.check(firstDeclarator.id)
          ) {
            firstDeclarator.id.name = `Catalyst${funcName}`;
          }
        }

        changes.push({
          type: 'update',
          description: `Updated function name from ${funcName} to Catalyst${funcName}`,
        });
      }
    }
  });

  // Update type alias declarations (e.g., type BadgeProps -> type CatalystBadgeProps)
  console.log('Looking for type alias declarations...');
  root.find(j.TSTypeAliasDeclaration).forEach(typeDecl => {
    const typeName = typeDecl.node.id.name;
    console.log('Found type alias:', typeName);

    if (
      typeof typeName === 'string' &&
      !typeName.startsWith('Catalyst') &&
      !typeName.startsWith('TouchTarget')
    ) {
      const newTypeName = `Catalyst${typeName}`;
      typeDecl.node.id.name = newTypeName;
      changes.push({
        type: 'update',
        description: `Updated type alias from ${typeName} to ${newTypeName}`,
      });
    }
  });

  console.log(`Export transform completed with ${changes.length} changes`);
  return changes;
}

export const catalystPrefixExportsTransform = createASTTransform({
  name: 'catalyst-prefix-exports',
  description: 'Add Catalyst prefix to exported functions and types',
  transform: (root, j) => transformCatalystPrefixExports(root, j),
});
