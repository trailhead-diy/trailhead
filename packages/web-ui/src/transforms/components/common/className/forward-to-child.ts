/**
 * Forward unused className props to first child component
 * Finds components that accept className but don't use it and forwards it to the first suitable child
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js';
import type { JSCodeshift, Collection } from 'jscodeshift';

/**
 * Check if a component has className parameter but doesn't use it
 */
function hasUnusedClassName(componentPath: any, j: JSCodeshift): boolean {
  const componentScope = j(componentPath);

  // Find all className identifiers in the component, excluding parameter declarations
  const classNameUsages = componentScope.find(j.Identifier, { name: 'className' }).filter(path => {
    // Exclude the parameter declaration itself (in object patterns)
    const parent = path.parent?.node;
    if (parent?.type === 'Property' && parent.key === path.node) {
      const grandParent = path.parent?.parent?.node;
      if (grandParent?.type === 'ObjectPattern') {
        return false; // This is a parameter declaration
      }
    }

    // Exclude variable declarations like `className` in destructuring
    if (parent?.type === 'ObjectPattern') {
      return false;
    }

    // Only count if this is actually being used as a value in JSX or expressions
    // Check if this is in a JSX attribute value or call expression
    let current = path.parent;
    while (current) {
      const node = current.node;
      // Include if it's used in JSX attribute value
      if (node?.type === 'JSXExpressionContainer' || node?.type === 'CallExpression') {
        return true;
      }
      // Include if it's being passed as a prop or argument
      if (node?.type === 'JSXAttribute' && node.value === path.parent.node) {
        return true;
      }
      current = current.parent;
    }

    return false;
  });

  return classNameUsages.length === 0;
}

/**
 * Find the first JSX element or component that can accept className
 */
function findFirstClassNameTarget(
  componentPath: any,
  j: JSCodeshift
): { element: any; hasExistingClassName: boolean; existingClassNameAttr?: any } | null {
  const componentScope = j(componentPath);

  // Find all JSX elements and components in return statements
  const jsxElements = componentScope.find(j.JSXOpeningElement).filter(path => {
    // Check if this is a suitable target
    const elementName = path.node.name;
    if (j.JSXIdentifier.check(elementName)) {
      const name = elementName.name;
      // Include HTML elements and React components (uppercase)
      return name === name.toLowerCase() || name[0] === name[0].toUpperCase();
    }
    return false;
  });

  if (jsxElements.length === 0) return null;

  // Get the first suitable element
  const firstElement = jsxElements.at(0);

  // Check if this element already has className
  const classNameAttr = firstElement
    .get()
    .node.attributes?.find(
      (attr: any) =>
        attr.type === 'JSXAttribute' &&
        attr.name?.type === 'JSXIdentifier' &&
        attr.name.name === 'className'
    );

  return {
    element: firstElement,
    hasExistingClassName: !!classNameAttr,
    existingClassNameAttr: classNameAttr,
  };
}

/**
 * Forward className to child components that don't use it
 */
function forwardClassNameToChild(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = [];

  // Process function components
  root.find(j.FunctionDeclaration).forEach(path => {
    const funcName = path.node.id?.name;
    if (!funcName || typeof funcName !== 'string' || funcName[0] !== funcName[0].toUpperCase())
      return;

    // Check if component has className parameter - look in destructuring
    const hasClassNameParam = path.node.params.some((param: any) => {
      if (param.type === 'ObjectPattern') {
        return param.properties.some((prop: any) => {
          return (
            (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
            prop.key.type === 'Identifier' &&
            prop.key.name === 'className'
          );
        });
      }
      return false;
    });

    if (hasClassNameParam) {
      const isUnused = hasUnusedClassName(path, j);

      if (isUnused) {
        const target = findFirstClassNameTarget(path, j);
        if (target) {
          const elementName = target.element.get().node.name?.name || 'element';

          if (target.hasExistingClassName) {
            // Merge with existing className using cn()
            const existingAttr = target.existingClassNameAttr;
            if (existingAttr?.value?.type === 'JSXExpressionContainer') {
              const existingValue = existingAttr.value.expression;

              // Create cn() call with existing value and className
              const cnCall = j.callExpression(j.identifier('cn'), [
                existingValue,
                j.identifier('className'),
              ]);
              existingAttr.value.expression = cnCall;
            } else if (existingAttr?.value?.type === 'StringLiteral') {
              // Convert string literal to cn() call
              const cnCall = j.callExpression(j.identifier('cn'), [
                j.stringLiteral(existingAttr.value.value),
                j.identifier('className'),
              ]);
              existingAttr.value = j.jsxExpressionContainer(cnCall);
            }
          } else {
            // Add new className attribute with cn() wrapper
            const classNameAttr = j.jsxAttribute(
              j.jsxIdentifier('className'),
              j.jsxExpressionContainer(
                j.callExpression(j.identifier('cn'), [j.identifier('className')])
              )
            );

            target.element.get().node.attributes = target.element.get().node.attributes || [];
            target.element.get().node.attributes.push(classNameAttr);
          }

          changes.push({
            type: 'className-forwarding',
            description: `Added className forwarding to ${elementName} in ${funcName}`,
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
        return (
          (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
          prop.key.type === 'Identifier' &&
          prop.key.name === 'className'
        );
      });

    if (hasClassNameParam && hasUnusedClassName(path, j)) {
      const target = findFirstClassNameTarget(path, j);
      if (target) {
        const elementName = target.element.get().node.name?.name || 'element';

        if (target.hasExistingClassName) {
          // Merge with existing className using cn()
          const existingAttr = target.existingClassNameAttr;
          if (existingAttr?.value?.type === 'JSXExpressionContainer') {
            const existingValue = existingAttr.value.expression;

            // Create cn() call with existing value and className
            const cnCall = j.callExpression(j.identifier('cn'), [
              existingValue,
              j.identifier('className'),
            ]);
            existingAttr.value.expression = cnCall;
          } else if (existingAttr?.value?.type === 'StringLiteral') {
            // Convert string literal to cn() call
            const cnCall = j.callExpression(j.identifier('cn'), [
              j.stringLiteral(existingAttr.value.value),
              j.identifier('className'),
            ]);
            existingAttr.value = j.jsxExpressionContainer(cnCall);
          }
        } else {
          // Add new className attribute with cn() wrapper
          const classNameAttr = j.jsxAttribute(
            j.jsxIdentifier('className'),
            j.jsxExpressionContainer(
              j.callExpression(j.identifier('cn'), [j.identifier('className')])
            )
          );

          target.element.get().node.attributes = target.element.get().node.attributes || [];
          target.element.get().node.attributes.push(classNameAttr);
        }

        changes.push({
          type: 'className-forwarding',
          description: `Added className forwarding to ${elementName} in ${name}`,
        });
      }
    }
  });

  return changes;
}

/**
 * Forward className to child transform
 * Created using AST transform factory for DRY implementation
 */
export const forwardClassNameToChildTransform = createASTTransform({
  name: 'forward-className-to-child',
  description: 'Forward unused className props to first suitable child component',
  transform: (root, j) => forwardClassNameToChild(root, j),
});
