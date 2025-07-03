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
      // Add object parameter with className
      node.params = [
        j.objectPattern([j.property('init', j.identifier('className'), j.identifier('className'))]),
      ];
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
      // Add className to existing object pattern
      node.params[0].properties.push(
        j.property('init', j.identifier('className'), j.identifier('className'))
      );
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
      // Add object parameter with className
      node.init.params = [
        j.objectPattern([j.property('init', j.identifier('className'), j.identifier('className'))]),
      ];
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
      // Add className to existing object pattern
      node.init.params[0].properties.push(
        j.property('init', j.identifier('className'), j.identifier('className'))
      );
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
              func.params[0].properties.push(
                j.property('init', j.identifier('className'), j.identifier('className'))
              );
              changes.push({
                type: 'parameter',
                description: `Added className to ${componentName} forwardRef`,
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
