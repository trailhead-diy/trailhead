/**
 * Transform: Catalyst Prefix Usage
 * Handles updating JSX and type usage to match Catalyst prefixed names
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js';
import type { JSCodeshift, Collection } from 'jscodeshift';

function transformCatalystPrefixUsage(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = [];
  console.log('=== Running catalyst-prefix-usage transform ===');

  // Build mapping of old names to new names based on what's exported
  const oldToNewMap = new Map<string, string>();

  // First, collect all exported function names in this file
  console.log('Collecting exported functions...');
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

      // If we find a Catalyst-prefixed export, map the base name to it
      if (funcName && funcName.startsWith('Catalyst')) {
        const baseName = funcName.replace('Catalyst', '');
        if (baseName) {
          oldToNewMap.set(baseName, funcName);
          console.log(`Mapped ${baseName} -> ${funcName}`);

          // Also map Props types
          const basePropsName = `${baseName}Props`;
          const newPropsName = `${funcName}Props`;
          oldToNewMap.set(basePropsName, newPropsName);
          console.log(`Mapped ${basePropsName} -> ${newPropsName}`);
        }
      }
    }
  });

  // Also collect type aliases that start with Catalyst
  console.log('Collecting type aliases...');
  root.find(j.TSTypeAliasDeclaration).forEach(typeDecl => {
    const typeName = typeDecl.node.id.name;
    if (typeof typeName === 'string' && typeName.startsWith('Catalyst')) {
      const baseName = typeName.replace('Catalyst', '');
      if (baseName) {
        oldToNewMap.set(baseName, typeName);
        console.log(`Mapped type ${baseName} -> ${typeName}`);
      }
    }
  });

  console.log(`Found ${oldToNewMap.size} mappings:`, Array.from(oldToNewMap.entries()));

  if (oldToNewMap.size === 0) {
    console.log('No mappings found, skipping updates.');
    return changes;
  }

  // Update JSX opening elements
  console.log('Updating JSX opening elements...');
  root.find(j.JSXOpeningElement).forEach(openingElement => {
    const name = openingElement.node.name;

    if (j.JSXIdentifier.check(name)) {
      const oldName = name.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        openingElement.node.name = j.jsxIdentifier(newName);
        changes.push({
          type: 'update',
          description: `Updated JSX opening element from <${oldName}> to <${newName}>`,
        });
      }
    }
  });

  // Update JSX closing elements
  root.find(j.JSXClosingElement).forEach(closingElement => {
    const name = closingElement.node.name;

    if (j.JSXIdentifier.check(name)) {
      const oldName = name.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        closingElement.node.name = j.jsxIdentifier(newName);
        changes.push({
          type: 'update',
          description: `Updated JSX closing element from </${oldName}> to </${newName}>`,
        });
      }
    }
  });

  // Update type references
  console.log('Updating type references...');
  root.find(j.TSTypeReference).forEach(typeRef => {
    if (j.Identifier.check(typeRef.node.typeName)) {
      const oldName = typeRef.node.typeName.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        console.log(`Updating type reference from ${oldName} to ${newName}`);
        typeRef.node.typeName.name = newName;
        changes.push({
          type: 'update',
          description: `Updated type reference from ${oldName} to ${newName}`,
        });
      }
    }
  });

  // Update typeof expressions
  console.log('Updating typeof expressions...');
  root.find(j.TSTypeQuery).forEach(typeQuery => {
    if (j.Identifier.check(typeQuery.node.exprName)) {
      const oldName = typeQuery.node.exprName.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        console.log(`Updating typeof reference from typeof ${oldName} to typeof ${newName}`);
        typeQuery.node.exprName = j.identifier(newName);
        changes.push({
          type: 'update',
          description: `Updated typeof reference from typeof ${oldName} to typeof ${newName}`,
        });
      }
    }
  });

  // Update JSX expression containers (like as={Component})
  console.log('Updating JSX expression containers...');
  root.find(j.JSXExpressionContainer).forEach(expression => {
    if (j.Identifier.check(expression.node.expression)) {
      const oldName = expression.node.expression.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        console.log(`Updating JSX expression from as={${oldName}} to as={${newName}}`);
        expression.node.expression = j.identifier(newName);
        changes.push({
          type: 'update',
          description: `Updated JSX expression from as={${oldName}} to as={${newName}}`,
        });
      }
    }
  });

  console.log(`Usage transform completed with ${changes.length} changes`);
  return changes;
}

export const catalystPrefixUsageTransform = createASTTransform({
  name: 'catalyst-prefix-usage',
  description: 'Update JSX and type usage to match Catalyst prefixed names',
  transform: (root, j) => transformCatalystPrefixUsage(root, j),
});
