/**
 * Reorder className arguments in cn() calls
 * Moves className to the end for proper tailwind-merge behavior
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js';
import type { JSCodeshift, Collection } from 'jscodeshift';

/**
 * Move className to the end of cn() calls for proper tailwind-merge behavior
 */
function moveClassNameToEnd(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = [];

  root
    .find(j.CallExpression, {
      callee: { type: 'Identifier', name: 'cn' },
    })
    .forEach(path => {
      const args = path.node.arguments;

      // Find className arguments
      const classNameIndices: number[] = [];
      args.forEach((arg, index) => {
        if (arg.type === 'Identifier' && arg.name === 'className') {
          classNameIndices.push(index);
        }
      });

      // If className is not at the end, move it
      if (
        classNameIndices.length > 0 &&
        classNameIndices[classNameIndices.length - 1] !== args.length - 1
      ) {
        // Remove className arguments
        const classNameArgs = classNameIndices.reverse().map(i => args.splice(i, 1)[0]);

        // Add them at the end
        args.push(...classNameArgs.reverse());

        changes.push({
          type: 'className-reorder',
          description: 'Moved className to end of cn() call',
        });
      }
    });

  return changes;
}

/**
 * Reorder className arguments transform
 * Created using AST transform factory for DRY implementation
 */
export const reorderClassNameArgsTransform = createASTTransform({
  name: 'reorder-className-args',
  description: 'Move className to end of cn() calls',
  transform: (root, j) => moveClassNameToEnd(root, j),
});
