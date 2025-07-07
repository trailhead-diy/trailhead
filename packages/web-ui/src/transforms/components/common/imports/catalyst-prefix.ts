/**
 * Transform component exports and imports to add Catalyst prefix
 * Adds 'Catalyst' prefix to exported components and 'catalyst-' prefix to relative imports
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js';
import type { JSCodeshift, Collection } from 'jscodeshift';

/**
 * Transform component exports and imports to add Catalyst prefix
 */
function transformCatalystPrefix(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = [];

  // Update export function declarations or export const XXX = forwardRef( to include Catalyst prefix,
  // for example: export function Button to export function CatalystButton
  // or export const Button = forwardRef(...) to export const CatalystButton = forwardRef(...)
  root.find(j.ExportNamedDeclaration).forEach(exportDecl => {
    if (exportDecl.node.declaration) {
      let funcName: string | undefined;

      if (j.FunctionDeclaration.check(exportDecl.node.declaration)) {
        funcName = exportDecl.node.declaration.id?.name.toString();
      } else if (j.VariableDeclaration.check(exportDecl.node.declaration)) {
        const firstDeclarator = exportDecl.node.declaration.declarations[0];
        if (
          firstDeclarator &&
          j.VariableDeclarator.check(firstDeclarator) &&
          j.Identifier.check(firstDeclarator.id)
        ) {
          funcName = firstDeclarator.id.name.toString();
        }
      }

      if (funcName && !funcName.startsWith('Catalyst') && !funcName.startsWith('TouchTarget')) {
        if (j.FunctionDeclaration.check(exportDecl.node.declaration)) {
          exportDecl.node.declaration.id!.name = `Catalyst${funcName}`;
        } else if (j.VariableDeclaration.check(exportDecl.node.declaration)) {
          const firstDeclarator = exportDecl.node.declaration.declarations[0];
          if (
            firstDeclarator &&
            j.VariableDeclarator.check(firstDeclarator) &&
            j.Identifier.check(firstDeclarator.id)
          ) {
            // console.log(`Updating variable name from ${firstDeclarator.id.name} to Catalyst${funcName}`);

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

  // Update import declarations to add catalyst- prefix to relative imports
  // For example: import { Button } from './button' to import { CatalystButton }
  // or import { Link } from './link' to import { CatalystLink }
  // and update the source to './catalyst-button' or './catalyst-link'
  const modifiedImports = new Set<string>();
  root.find(j.ImportDeclaration).forEach(importDecl => {
    const source = importDecl.node.source.value?.toString() || '';
    if (source.startsWith('./') && !source.startsWith('./catalyst-')) {
      const newSource = `./catalyst-${source.slice(2)}`;
      // console.log(`Updating import from ${source} to ${newSource}`);
      importDecl.node.specifiers?.forEach(specifier => {
        if (j.ImportSpecifier.check(specifier) && j.Identifier.check(specifier.imported)) {
          // Update the imported name to include Catalyst prefix
          if (
            !specifier.imported.name.startsWith('Catalyst') &&
            !specifier.imported.name.startsWith('TouchTarget')
          ) {
            specifier.imported.name = `Catalyst${specifier.imported.name}`;
            modifiedImports.add(specifier.imported.name);
            // console.log(`Updated import specifier from ${specifier.imported.name} to Catalyst${specifier.imported.name}`);
          }
        }
      });
      importDecl.node.source.value = newSource;
      changes.push({
        type: 'update',
        description: `Updated import from ${source} to ${newSource}`,
      });
    }
  });

  if (modifiedImports.size === 0) {
    console.log('No modified imports found, skipping JSX element updates.');
    return changes;
  }

  console.log(`Modified imports: ${Array.from(modifiedImports).join(', ')}`);

  //update typeof usages in generics of modified imports, for example:
  // Omit<Headless.DescriptionProps<typeof Text> to Omit<Headless.DescriptionProps<typeof CatalystText>
  root.find(j.GenericTypeAnnotation).forEach(typeRef => {
    if (j.Identifier.check(typeRef.node.id) && modifiedImports.has(typeRef.node.id.name)) {
      const newTypeName = `Catalyst${typeRef.node.id.name}`;
      console.log(`Updating type reference from ${typeRef.node.id.name} to ${newTypeName}`);
      typeRef.node.id = j.identifier(newTypeName);
      changes.push({
        type: 'update',
        description: `Updated type reference from ${typeRef.node.id.name} to ${newTypeName}`,
      });
    }
  });
  // Update the usage of the transformed imported components in the code
  // For example: <Button /> to <CatalystButton />
  // or <Button>...</Button> to <CatalystButton>...</CatalystButton>
  root.find(j.JSXOpeningElement).forEach(openingElement => {
    const name = openingElement.node.name;

    if (j.JSXIdentifier.check(name) && modifiedImports.has(name.name)) {
      console.log(`Updating JSX element from <${name.name}> to <Catalyst${name.name}>`);

      const newName = `Catalyst${name.name}`;
      console.log(`Updating JSX element from <${name.name}> to <${newName}>`);
      openingElement.node.name = j.jsxIdentifier(newName);
      changes.push({
        type: 'update',
        description: `Updated JSX element from <${name.name}> to <${newName}>`,
      });
    }
  });

  return changes;
}

/**
 * Catalyst prefix transform
 * Created using AST transform factory for DRY implementation
 */
export const catalystPrefixTransform = createASTTransform({
  name: 'catalyst-prefix',
  description: 'Add catalyst- prefix to component imports',
  transform: (root, j) => transformCatalystPrefix(root, j),
});
