/**
 * Atomic transform: Reorder function parameters to fix rest parameter syntax
 */

import { createRegexTransform } from '../../core/ast-factory';
import { type TransformChange } from '../../core/types';

export const reorderParameters = createRegexTransform(
  'reorder-parameters',
  'Fix invalid rest parameter ordering in destructuring patterns',
  (source: string, changes: TransformChange[]): string => {
    // Pattern to match invalid rest parameter ordering: ...props, otherParam
    const invalidRestPattern =
      /(\.\.\.[a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\s*=\s*[^,}]+)?)\s*}/g;

    const fixedSource = source.replace(invalidRestPattern, (match, restParam, afterParam) => {
      if (restParam.startsWith('...') && !afterParam.startsWith('...')) {
        changes.push({
          type: 'reorder-parameters',
          description: `Fixed invalid rest parameter ordering: ${restParam}, ${afterParam} → ${afterParam}, ${restParam}`,
          before: `${restParam}, ${afterParam}`,
          after: `${afterParam}, ${restParam}`,
        });

        return `${afterParam}, ${restParam}}`;
      }
      return match;
    });

    return fixedSource;
  }
);
