/**
 * Functional transform to convert clsx imports to cn imports
 *
 * Converts clsx library imports and usage to cn utility imports for consistent
 * class name handling across Catalyst UI components. Handles both import
 * statements and function call transformations with comprehensive pattern matching.
 *
 * Transform process:
 * 1. Replaces `import clsx from 'clsx'` with `import { cn } from '../utils/cn'`
 * 2. Converts all `clsx(...)` function calls to `cn(...)`
 * 3. Validates transformation completeness and warns about remaining references
 * 4. Maintains original code structure and formatting
 *
 * Examples of transformations:
 *
 * Import statement conversion:
 * ```
 * import clsx from 'clsx'
 * // becomes:
 * import { cn } from '../utils/cn';
 * ```
 *
 * Function call conversion:
 * ```
 * const classes = clsx(
 *   'base-classes',
 *   condition && 'conditional-class',
 *   { 'object-class': isActive }
 * )
 * // becomes:
 * const classes = cn(
 *   'base-classes',
 *   condition && 'conditional-class',
 *   { 'object-class': isActive }
 * )
 * ```
 *
 * Component usage conversion:
 * ```
 * <div className={clsx('flex items-center', className)} />
 * // becomes:
 * <div className={cn('flex items-center', className)} />
 * ```
 *
 * Uses CLI framework Result types for consistent error handling.
 * Pure functional interface with no classes.
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { createTransformMetadata, executeTransform, type TransformResult } from '../utils.js';

/**
 * Transform metadata
 */
export const clsxToCnTransform = createTransformMetadata(
  'clsx-to-cn',
  'Convert clsx imports to cn imports',
  'import'
);

/**
 * Convert clsx library imports and usage to cn utility imports
 *
 * Transform process:
 * 1. Detect and replace clsx import statements with cn imports
 * 2. Convert all clsx function calls to cn function calls
 * 3. Validate transformation completeness and detect remaining references
 *
 * Examples:
 * - Converts `import clsx from 'clsx'` → `import { cn } from '../utils/cn'`
 * - Converts `clsx('class1', 'class2')` → `cn('class1', 'class2')`
 * - Converts `clsx({ active: isActive })` → `cn({ active: isActive })`
 */
export function transformClsxToCn(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    let content = input;
    const warnings: string[] = [];
    let changed = false;

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 1: Replace clsx Import Statements
    //
    // From:  import clsx from 'clsx'
    // To:    import { cn } from '../utils/cn';
    //
    /////////////////////////////////////////////////////////////////////////////////
    const clsxImportPattern = /import\s+clsx\s+from\s+['"]clsx['"]/g;
    if (clsxImportPattern.test(content)) {
      content = content.replace(clsxImportPattern, "import { cn } from '../utils/cn';");
      changed = true;
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 2: Replace clsx Function Calls
    //
    // From:  clsx('flex items-center', className)
    // To:    cn('flex items-center', className)
    //
    /////////////////////////////////////////////////////////////////////////////////
    const clsxUsagePattern = /\bclsx\(/g;
    if (clsxUsagePattern.test(content)) {
      content = content.replace(clsxUsagePattern, 'cn(');
      changed = true;
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 3: Validation - Check for Remaining clsx References
    // Finds:
    //        any remaining 'clsx' references not caught by patterns above
    //        such as dynamic imports, comments, or complex patterns
    //
    /////////////////////////////////////////////////////////////////////////////////
    const remainingClsxPattern = /\bclsx\b/g;
    if (remainingClsxPattern.test(content)) {
      warnings.push('Found remaining clsx references that may need manual review');
    }

    return { content, changed, warnings };
  });
}
