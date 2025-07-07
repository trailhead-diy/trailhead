/**
 * Transform clsx imports to cn imports
 * Replaces `import clsx from 'clsx'` with `import { cn } from '../utils/cn'`
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js';
import type { JSCodeshift, Collection } from 'jscodeshift';

/**
 * Transform imports and function calls from clsx to cn
 */
function transformCatalystPrefix(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = [];

  root.find(j.ImportDeclaration).forEach(importDecl => {
    const source = importDecl.node.source.value?.toString() || '';
    if (source.startsWith('./') && !source.startsWith('./catalyst-')) {
      const newSource = `./catalyst-${source.slice(2)}`;
      importDecl.node.source.value = newSource;
      changes.push({
        type: 'update',
        description: `Updated import from ${source} to ${newSource}`,
      });
    }
  });

  return changes;
}

/**
 * clsx to cn import transform
 * Created using AST transform factory for DRY implementation
 */
export const catalystPrefixTransform = createASTTransform({
  name: 'catalyst-prefix',
  description: 'Add catalyst- prefix to component imports',
  transform: (root, j) => transformCatalystPrefix(root, j),
});
