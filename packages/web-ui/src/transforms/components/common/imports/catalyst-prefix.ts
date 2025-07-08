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

      if (funcName && !funcName.startsWith('Catalyst')) {
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
  root.find(j.TSTypeAliasDeclaration).forEach(typeDecl => {
    const typeName = typeDecl.node.id.name;
    if (typeof typeName === 'string' && !typeName.startsWith('Catalyst')) {
      const newTypeName = `Catalyst${typeName}`;
      typeDecl.node.id.name = newTypeName;
      changes.push({
        type: 'update',
        description: `Updated type alias from ${typeName} to ${newTypeName}`,
      });
    }
  });

  // Update import declarations to add catalyst- prefix to relative imports
  // For example: import { Button } from './button' to import { CatalystButton }
  // or import { Link } from './link' to import { CatalystLink }
  // and update the source to './catalyst-button' or './catalyst-link'
  const oldToNewMap = new Map<string, string>();

  // First, collect all exported function names and type definitions in this file to handle same-file references
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

      if (funcName) {
        if (!funcName.startsWith('Catalyst')) {
          // Not prefixed yet, add to mapping
          oldToNewMap.set(funcName, `Catalyst${funcName}`);
        } else {
          // Already prefixed, create base name mapping for same-file references
          const baseName = funcName.replace('Catalyst', '');
          if (baseName && !oldToNewMap.has(baseName)) {
            oldToNewMap.set(baseName, funcName);
          }
        }
      }
    }
  });

  // Also collect type definitions (like BadgeProps -> CatalystBadgeProps)
  root.find(j.TSTypeAliasDeclaration).forEach(typeDecl => {
    const typeName = typeDecl.node.id.name;
    if (typeof typeName === 'string') {
      if (!typeName.startsWith('Catalyst')) {
        // Not prefixed yet, add to mapping
        oldToNewMap.set(typeName, `Catalyst${typeName}`);
      } else {
        // Already prefixed, create base name mapping
        const baseName = typeName.replace('Catalyst', '');
        if (baseName && !oldToNewMap.has(baseName)) {
          oldToNewMap.set(baseName, typeName);
        }
      }
    }
  });

  // Handle Props suffix for all Catalyst functions (e.g., if CatalystAvatar exists, map AvatarProps -> CatalystAvatarProps)
  const catalystFunctions = Array.from(oldToNewMap.values()).filter(name =>
    name.startsWith('Catalyst')
  );
  catalystFunctions.forEach(catalystName => {
    const baseName = catalystName.replace('Catalyst', '');
    if (baseName) {
      const basePropsName = `${baseName}Props`;
      const catalystPropsName = `Catalyst${baseName}Props`;
      if (!oldToNewMap.has(basePropsName)) {
        oldToNewMap.set(basePropsName, catalystPropsName);
      }
    }
  });

  root.find(j.ImportDeclaration).forEach(importDecl => {
    const source = importDecl.node.source.value?.toString() || '';
    if (source.startsWith('./') && !source.startsWith('./catalyst-')) {
      const newSource = `./catalyst-${source.slice(2)}`;

      importDecl.node.specifiers?.forEach(specifier => {
        if (j.ImportSpecifier.check(specifier) && j.Identifier.check(specifier.imported)) {
          // Update the imported name to include Catalyst prefix
          if (!specifier.imported.name.startsWith('Catalyst')) {
            const oldName = specifier.imported.name;
            const newName = `Catalyst${oldName}`;
            specifier.imported.name = newName;
            oldToNewMap.set(oldName, newName);
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

  if (oldToNewMap.size === 0) {
    return changes;
  }

  // Update typeof usages in generics of modified imports, for example:
  // Omit<Headless.DescriptionProps<typeof Text> to Omit<Headless.DescriptionProps<typeof CatalystText>
  root.find(j.TSTypeQuery).forEach(typeQuery => {
    if (j.Identifier.check(typeQuery.node.exprName)) {
      const oldName = typeQuery.node.exprName.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        typeQuery.node.exprName = j.identifier(newName);
        changes.push({
          type: 'update',
          description: `Updated typeof reference from typeof ${oldName} to typeof ${newName}`,
        });
      }
    }
  });

  // Update as={Component} prop values, for example: as={Text} to as={CatalystText}
  root.find(j.JSXExpressionContainer).forEach(expression => {
    if (j.Identifier.check(expression.node.expression)) {
      const oldName = expression.node.expression.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        expression.node.expression = j.identifier(newName);
        changes.push({
          type: 'update',
          description: `Updated JSX expression from as={${oldName}} to as={${newName}}`,
        });
      }
    }
  });

  // Update the usage of the transformed imported components in JSX elements
  // For example: <Button /> to <CatalystButton />
  // or <Button>...</Button> to <CatalystButton>...</CatalystButton>
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

  // Update JSX closing elements to match opening elements
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

  // Update type references in all contexts (including parameter types, return types, etc.)
  root.find(j.TSTypeReference).forEach(typeRef => {
    if (j.Identifier.check(typeRef.node.typeName)) {
      const oldName = typeRef.node.typeName.name;
      const newName = oldToNewMap.get(oldName);
      if (newName) {
        typeRef.node.typeName.name = newName;
        changes.push({
          type: 'update',
          description: `Updated type reference from ${oldName} to ${newName}`,
        });
      }
    }
  });

  // Update direct identifier references in expression contexts
  root.find(j.Identifier).forEach(identifier => {
    const oldName = identifier.node.name;
    const newName = oldToNewMap.get(oldName);
    if (newName) {
      // Check if this identifier is in an expression context and not already handled
      const parent = identifier.parent;

      // Skip if this is part of a Headless namespace member expression
      if (parent && j.MemberExpression.check(parent.node)) {
        // Check if the object is 'Headless'
        if (j.Identifier.check(parent.node.object) && parent.node.object.name === 'Headless') {
          return;
        }
      }

      if (
        parent &&
        !j.ImportSpecifier.check(parent.node) &&
        !j.JSXOpeningElement.check(parent.node) &&
        !j.JSXClosingElement.check(parent.node) &&
        !j.JSXExpressionContainer.check(parent.node) &&
        !j.TSTypeQuery.check(parent.node) &&
        !j.TSTypeReference.check(parent.node) &&
        !j.TSTypeAliasDeclaration.check(parent.node) &&
        !j.FunctionDeclaration.check(parent.node) &&
        !j.VariableDeclarator.check(parent.node) &&
        !j.MemberExpression.check(parent.node) // Skip member expressions entirely
      ) {
        identifier.node.name = newName;
        changes.push({
          type: 'update',
          description: `Updated identifier reference from ${oldName} to ${newName}`,
        });
      }
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
