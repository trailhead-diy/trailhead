/**
 * Fix parameter ordering - ensure ...props is always last in destructuring patterns
 * Fixes invalid JavaScript syntax where rest parameters come before other parameters
 */

import type {
  Transform,
  TransformResult,
  TransformOptions,
  Change,
} from '../../../shared/types.js';

/**
 * Pre-process source code to fix invalid rest parameter ordering using regex
 * This fixes syntax errors before AST parsing
 */
function fixRestParameterOrdering(source: string): { source: string; changes: Change[] } {
  const changes: Change[] = [];

  // Simple pattern to match specific case: ...props, className
  // This avoids infinite loops by being very specific
  const invalidRestPattern =
    /(\.\.\.[a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\s*=\s*[^,}]+)?)\s*}/g;

  let fixedSource = source.replace(invalidRestPattern, (match, restParam, afterParam) => {
    // Only fix if this is actually a rest parameter followed by another parameter
    if (restParam.startsWith('...') && !afterParam.startsWith('...')) {
      console.log(
        `🔄 Fixed invalid rest parameter ordering: ${restParam}, ${afterParam} → ${afterParam}, ${restParam}`
      );
      changes.push({
        type: 'regex-parameter-reordering',
        description: `Fixed invalid rest parameter ordering: ${restParam}, ${afterParam} → ${afterParam}, ${restParam}`,
        before: `${restParam}, ${afterParam}`,
        after: `${afterParam}, ${restParam}`,
      });

      return `${afterParam}, ${restParam}}`;
    }
    return match;
  });

  // Also fix missing className forwarding in specific problematic patterns
  // Pattern: return <Element as={as} {...props} /> where className param exists but isn't used
  const missingClassNamePattern =
    /(\breturn\s*<[A-Z][a-zA-Z.]*)\s+(as=\{[^}]+\})\s+(\{\.\.\.props\})\s*\/>/g;

  fixedSource = fixedSource.replace(
    missingClassNamePattern,
    (match, element, asProps, spreadProps) => {
      // Check if className is a parameter in this function
      if (fixedSource.includes('className,') || fixedSource.includes('className }')) {
        console.log(`🔄 Added missing className forwarding: ${match}`);
        changes.push({
          type: 'regex-className-forwarding',
          description: `Added missing className forwarding to JSX element`,
          before: match,
          after: `${element} ${asProps} className={cn(className)} ${spreadProps} />`,
        });

        return `${element} ${asProps} className={cn(className)} ${spreadProps} />`;
      }
      return match;
    }
  );

  return { source: fixedSource, changes };
}

/**
 * Parameter reordering transform with regex pre-processing
 * Fixes syntax errors before AST parsing and then handles remaining cases
 */
export const reorderParametersTransform: Transform = {
  name: 'reorder-parameters',
  description: 'Ensure rest parameters (...props) come last in destructuring patterns',
  type: 'regex',
  execute: (content: string, options?: TransformOptions): TransformResult => {
    // First, fix invalid syntax with regex
    const { source: fixedSource, changes: regexChanges } = fixRestParameterOrdering(content);

    // If we made regex changes, log them
    if (regexChanges.length > 0 && options?.verbose) {
      console.log(`📝 Regex fixes applied: ${regexChanges.length}`);
      regexChanges.forEach(change => {
        console.log(`  • ${change.description}: ${change.before} → ${change.after}`);
      });
    }

    return {
      name: 'reorder-parameters',
      type: 'regex',
      content: fixedSource,
      changes: regexChanges,
      hasChanges: regexChanges.length > 0,
    };
  },
};
