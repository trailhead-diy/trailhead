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
  // create a transformations so that if the filename starts with catalyst-*, we change the same level imports to catalyst-*
  //for example, if the file is catalyst-button.tsx, we change imports from './text' to './catalyst-text'

  let _needsCatalystPrefix = false;

  root.find(j.ImportDeclaration).forEach(importDecl => {
    const source = importDecl.node.source.value?.toString() || '';
    if (source.startsWith('./') && !source.startsWith('./catalyst-')) {
      console.log(`Transforming import: ${source} to catalyst-${source.slice(2)}`);
      _needsCatalystPrefix = true;
      changes.push({
        type: 'update',
        path: importDecl.node.source,
        value: `./catalyst-${source.slice(2)}`,
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
