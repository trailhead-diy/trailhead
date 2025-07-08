/**
 * Atomic transform: Wrap JSX expressions with function calls
 */

import { createASTTransform } from '../../core/ast-factory';
import { type TransformChange } from '../../core/types';

export interface WrapExpressionOptions {
  wrapperFunction: string;
  attributeName: string;
  condition?: (value: any) => boolean;
  skipIfAlreadyWrapped?: boolean;
}

export const wrapExpression = createASTTransform(
  'wrap-expression',
  'Wrap JSX expressions with function calls',
  (fileInfo, api, options, changes: TransformChange[]) => {
    const {
      wrapperFunction,
      attributeName,
      condition,
      skipIfAlreadyWrapped = true,
    } = options as WrapExpressionOptions;
    const { j } = api;
    const root = j(fileInfo.source);

    // Helper to check if expression is already wrapped
    const isAlreadyWrapped = (expression: any) => {
      return (
        expression.type === 'CallExpression' &&
        expression.callee.type === 'Identifier' &&
        expression.callee.name === wrapperFunction
      );
    };

    // Find JSX attributes with the specified name
    root.find(j.JSXAttribute, { name: { name: attributeName } }).forEach(path => {
      const value = path.value.value;

      // Only process JSX expression containers
      if (value?.type === 'JSXExpressionContainer') {
        const expression = value.expression;

        // Skip if already wrapped
        if (skipIfAlreadyWrapped && isAlreadyWrapped(expression)) {
          return;
        }

        // Apply condition if provided
        if (condition && !condition(expression)) {
          return;
        }

        // Wrap the expression
        if (expression.type !== 'JSXEmptyExpression') {
          value.expression = j.callExpression(j.identifier(wrapperFunction), [expression]);
        }

        changes.push({
          type: 'wrap-jsx-expression',
          description: `Wrapped ${attributeName} with ${wrapperFunction}()`,
          location: `JSX attribute ${attributeName}`,
        });
      }
    });

    return changes.length > 0 ? root.toSource() : null;
  }
);
