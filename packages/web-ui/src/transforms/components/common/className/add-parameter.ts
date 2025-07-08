/**
 * Add className parameter to components that need it
 * Adds the className prop to function signatures and ensures it's typed correctly
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js';
import type { JSCodeshift, Collection } from 'jscodeshift';

// Components that should not have className parameter
const COMPONENTS_WITHOUT_CLASSNAME = [
  'SidebarLayout',
  'StackedLayout',
  'AuthLayout',
  'TouchTarget',
  'MobileSidebar',
];

/**
 * Add className prop to component functions that don't have it
 */
function addClassNameProp(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = [];

  // Find exported function components
  root.find(j.FunctionDeclaration).forEach(path => {
    const node = path.node;
    const name = node.id?.name;

    // Check if it's a component (starts with uppercase)
    if (!name || typeof name !== 'string' || name[0] !== name[0].toUpperCase()) return;

    // Skip components that shouldn't have className
    if (COMPONENTS_WITHOUT_CLASSNAME.includes(name)) return;

    // Check if it's exported
    const parent = path.parent;
    if (
      parent.node.type !== 'ExportNamedDeclaration' &&
      parent.node.type !== 'ExportDefaultDeclaration' &&
      !root.find(j.ExportNamedDeclaration, {
        specifiers: [
          {
            type: 'ExportSpecifier',
            local: { name },
          },
        ],
      }).length
    ) {
      return;
    }

    // Check if it has parameters
    if (node.params.length === 0) {
      // Add object parameter with className (shorthand)
      const classNameProp = j.property(
        'init',
        j.identifier('className'),
        j.identifier('className')
      );
      classNameProp.shorthand = true;
      node.params = [j.objectPattern([classNameProp])];
      changes.push({
        type: 'parameter',
        description: `Added className parameter to ${name}`,
      });
    } else if (
      node.params[0].type === 'ObjectPattern' &&
      !node.params[0].properties.some((prop: any) => {
        if (prop.type === 'Property' && prop.key.type === 'Identifier') {
          return prop.key.name === 'className';
        }
        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
          return prop.key.name === 'className';
        }
        return false;
      })
    ) {
      // Add className to existing object pattern (shorthand)
      const classNameProp = j.property(
        'init',
        j.identifier('className'),
        j.identifier('className')
      );
      classNameProp.shorthand = true;
      node.params[0].properties.push(classNameProp);
      changes.push({
        type: 'parameter',
        description: `Added className to ${name} parameters`,
      });
    }
  });

  // Process arrow function components
  root.find(j.VariableDeclarator).forEach(path => {
    const node = path.node;
    const name = node.id?.type === 'Identifier' ? node.id.name : null;

    // Check if it's a component (starts with uppercase)
    if (!name || typeof name !== 'string' || name[0] !== name[0].toUpperCase()) return;

    // Skip components that shouldn't have className
    if (COMPONENTS_WITHOUT_CLASSNAME.includes(name)) return;

    // Check if it's an arrow function
    if (node.init?.type !== 'ArrowFunctionExpression') return;

    // Check if it has parameters
    if (node.init.params.length === 0) {
      // Add object parameter with className (shorthand)
      const classNameProp = j.property(
        'init',
        j.identifier('className'),
        j.identifier('className')
      );
      classNameProp.shorthand = true;
      node.init.params = [j.objectPattern([classNameProp])];
      changes.push({
        type: 'parameter',
        description: `Added className parameter to ${name}`,
      });
    } else if (
      node.init.params[0].type === 'ObjectPattern' &&
      !node.init.params[0].properties.some((prop: any) => {
        if (prop.type === 'Property' && prop.key.type === 'Identifier') {
          return prop.key.name === 'className';
        }
        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
          return prop.key.name === 'className';
        }
        return false;
      })
    ) {
      // Add className to existing object pattern (shorthand)
      const classNameProp = j.property(
        'init',
        j.identifier('className'),
        j.identifier('className')
      );
      classNameProp.shorthand = true;
      node.init.params[0].properties.push(classNameProp);
      changes.push({
        type: 'parameter',
        description: `Added className to ${name} parameters`,
      });
    }
  });

  // Process React.forwardRef components
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'React' },
        property: { type: 'Identifier', name: 'forwardRef' },
      },
    })
    .forEach(path => {
      const args = path.node.arguments;
      if (args.length > 0 && args[0].type === 'ArrowFunctionExpression') {
        const func = args[0];

        // Check if first param is object pattern without className
        if (
          func.params.length > 0 &&
          func.params[0].type === 'ObjectPattern' &&
          !func.params[0].properties.some((prop: any) => {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
              return prop.key.name === 'className';
            }
            return false;
          })
        ) {
          // Check component name from parent variable
          const parent = path.parent;
          if (parent.node.type === 'VariableDeclarator' && parent.node.id.type === 'Identifier') {
            const componentName = parent.node.id.name;

            // Skip if it's a component that shouldn't have className
            if (!COMPONENTS_WITHOUT_CLASSNAME.includes(componentName)) {
              const classNameProp = j.property(
                'init',
                j.identifier('className'),
                j.identifier('className')
              );
              classNameProp.shorthand = true;
              func.params[0].properties.push(classNameProp);
              changes.push({
                type: 'parameter',
                description: `Added className to ${componentName} forwardRef`,
              });
            }
          }
        }
      }
    });

  // Add className?: string to TypeScript type annotations in function parameters only
  root.find(j.FunctionDeclaration).forEach(funcDecl => {
    funcDecl.node.params.forEach(param => {
      // Handle ObjectPattern parameters with type annotations
      if (j.ObjectPattern.check(param) && param.typeAnnotation) {
        const typeAnnotation = param.typeAnnotation;
        if (
          j.TSTypeAnnotation.check(typeAnnotation) &&
          j.TSTypeLiteral.check(typeAnnotation.typeAnnotation)
        ) {
          const typeLiteral = typeAnnotation.typeAnnotation;
          const hasClassName = typeLiteral.members.some(
            member =>
              j.TSPropertySignature.check(member) &&
              j.Identifier.check(member.key) &&
              member.key.name === 'className'
          );

          if (!hasClassName) {
            // Check if the ObjectPattern has className parameter
            const hasClassNameParam = param.properties.some((prop: any) => {
              return (
                prop.type === 'Property' &&
                prop.key.type === 'Identifier' &&
                prop.key.name === 'className'
              );
            });

            if (hasClassNameParam) {
              // Add className?: string property
              const classNameProp = j.tsPropertySignature(
                j.identifier('className'),
                j.tsTypeAnnotation(j.tsStringKeyword())
              );
              classNameProp.optional = true;

              typeLiteral.members.push(classNameProp);

              changes.push({
                type: 'type',
                description: 'Added className?: string to function parameter type literal',
              });
            }
          }
        }
      }

      // Handle Identifier parameters with type annotations (original logic)
      if (j.Identifier.check(param) && param.typeAnnotation) {
        const typeAnnotation = param.typeAnnotation;
        if (
          j.TSTypeAnnotation.check(typeAnnotation) &&
          j.TSTypeLiteral.check(typeAnnotation.typeAnnotation)
        ) {
          const typeLiteral = typeAnnotation.typeAnnotation;
          const hasClassName = typeLiteral.members.some(
            member =>
              j.TSPropertySignature.check(member) &&
              j.Identifier.check(member.key) &&
              member.key.name === 'className'
          );

          if (!hasClassName) {
            // Add className?: string property
            const classNameProp = j.tsPropertySignature(
              j.identifier('className'),
              j.tsTypeAnnotation(j.tsStringKeyword())
            );
            classNameProp.optional = true;

            typeLiteral.members.push(classNameProp);

            changes.push({
              type: 'type',
              description: 'Added className?: string to function parameter type literal',
            });
          }
        }
      }
    });
  });

  // Handle React.PropsWithChildren patterns
  root.find(j.TSTypeReference).forEach(typeRef => {
    // Look for React.PropsWithChildren<{...}> patterns
    if (
      j.TSQualifiedName.check(typeRef.node.typeName) &&
      j.Identifier.check(typeRef.node.typeName.left) &&
      j.Identifier.check(typeRef.node.typeName.right) &&
      typeRef.node.typeName.left.name === 'React' &&
      typeRef.node.typeName.right.name === 'PropsWithChildren'
    ) {
      // Check if it has type arguments
      if (typeRef.node.typeParameters?.params?.[0]) {
        const firstParam = typeRef.node.typeParameters.params[0];

        if (j.TSTypeLiteral.check(firstParam)) {
          // Check if className property already exists
          const hasClassName = firstParam.members.some(
            member =>
              j.TSPropertySignature.check(member) &&
              j.Identifier.check(member.key) &&
              member.key.name === 'className'
          );

          if (!hasClassName) {
            // Add className?: string property
            const classNameProp = j.tsPropertySignature(
              j.identifier('className'),
              j.tsTypeAnnotation(j.tsStringKeyword())
            );
            classNameProp.optional = true;

            firstParam.members.push(classNameProp);

            changes.push({
              type: 'type',
              description: 'Added className?: string to React.PropsWithChildren type',
            });
          }
        }
      }
    }
  });

  return changes;
}

/**
 * Add className parameter transform
 * Created using AST transform factory for DRY implementation
 */
export const addClassNameParameterTransform = createASTTransform({
  name: 'add-className-parameter',
  description: 'Add className parameter to components that need it',
  transform: (root, j) => addClassNameProp(root, j),
});
