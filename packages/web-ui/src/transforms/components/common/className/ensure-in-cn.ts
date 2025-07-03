/**
 * Ensure className is used in cn() calls
 * Makes sure the className prop is actually included in cn() calls
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js';
import type { JSCodeshift, Collection } from 'jscodeshift';

/**
 * Ensure className is used in cn() calls in the component
 */
function ensureClassNameInCn(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = [];

  // Process function components
  root.find(j.FunctionDeclaration).forEach(path => {
    const hasClassNameParam = path.node.params.some((param: any) => {
      if (param.type === 'ObjectPattern') {
        return param.properties.some((prop: any) => {
          return (
            prop.type === 'Property' &&
            prop.key.type === 'Identifier' &&
            prop.key.name === 'className'
          );
        });
      }
      return false;
    });

    if (hasClassNameParam) {
      // Find cn() calls in the component that are used in className attributes
      const cnCalls = j(path)
        .find(j.CallExpression, {
          callee: { type: 'Identifier', name: 'cn' },
        })
        .filter(cnPath => {
          // Check if this cn() call is used in a className JSX attribute
          let parent = cnPath.parent;
          while (parent && parent.node) {
            if (
              parent.node.type === 'JSXAttribute' &&
              parent.node.name?.type === 'JSXIdentifier' &&
              parent.node.name.name === 'className'
            ) {
              return true;
            }
            parent = parent.parent;
          }
          return false;
        });

      if (cnCalls.length > 0) {
        const firstCnCall = cnCalls.at(0);
        const args = firstCnCall.get().node.arguments;

        // Check if className is already in the arguments
        const hasClassName = args.some(
          (arg: any) => arg.type === 'Identifier' && arg.name === 'className'
        );

        if (!hasClassName) {
          // Add className as the last argument
          args.push(j.identifier('className'));
          changes.push({
            type: 'className-usage',
            description: 'Added className to cn() call in function component',
          });
        }
      }
    }
  });

  // Process arrow function components
  root.find(j.VariableDeclarator).forEach(path => {
    const node = path.node;
    const name = node.id?.type === 'Identifier' ? node.id.name : null;

    // Check if it's a component (starts with uppercase)
    if (!name || typeof name !== 'string' || name[0] !== name[0].toUpperCase()) return;

    // Check if it's an arrow function
    if (node.init?.type !== 'ArrowFunctionExpression') return;

    // Check if component has className parameter
    const hasClassNameParam =
      node.init.params.length > 0 &&
      node.init.params[0].type === 'ObjectPattern' &&
      node.init.params[0].properties.some((prop: any) => {
        if (prop.type === 'Property' && prop.key.type === 'Identifier') {
          return prop.key.name === 'className';
        }
        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
          return prop.key.name === 'className';
        }
        return false;
      });

    if (hasClassNameParam) {
      // Find the first cn() call in the component that's used in a className attribute
      const cnCalls = j(path)
        .find(j.CallExpression, {
          callee: { type: 'Identifier', name: 'cn' },
        })
        .filter(cnPath => {
          // Check if this cn() call is used in a className JSX attribute
          let parent = cnPath.parent;
          while (parent && parent.node) {
            if (
              parent.node.type === 'JSXAttribute' &&
              parent.node.name?.type === 'JSXIdentifier' &&
              parent.node.name.name === 'className'
            ) {
              return true;
            }
            parent = parent.parent;
          }
          return false;
        });

      if (cnCalls.length > 0) {
        const firstCnCall = cnCalls.at(0);
        const args = firstCnCall.get().node.arguments;

        // Check if className is already in the arguments
        const hasClassName = args.some(
          (arg: any) => arg.type === 'Identifier' && arg.name === 'className'
        );

        if (!hasClassName) {
          // Add className as the last argument
          args.push(j.identifier('className'));
          changes.push({
            type: 'className-usage',
            description: `Added className to cn() call in ${name}`,
          });
        }
      }
    }
  });

  return changes;
}

/**
 * Ensure className in cn() transform
 * Created using AST transform factory for DRY implementation
 */
export const ensureClassNameInCnTransform = createASTTransform({
  name: 'ensure-className-in-cn',
  description: 'Ensure className parameter is used in cn() calls',
  transform: (root, j) => ensureClassNameInCn(root, j),
});
