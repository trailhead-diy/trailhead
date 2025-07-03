/**
 * Post-process AST output to match traditional formatting patterns exactly
 */

import { STANDARD_AST_FORMAT_OPTIONS } from './ast-options.js';
import { standardASTPostProcessing } from './formatters.js';

/**
 * Post-process AST output to match traditional formatting patterns exactly
 * Uses composable formatting pipeline for maintainable and testable formatting
 */
export function postProcessAstOutput(code: string): string {
  return standardASTPostProcessing(code);
}

/**
 * Apply consistent AST transformation with standardized formatting
 * Uses the composable post-processing pipeline
 */
export function transformWithStandardFormatting(root: any, hasChanges: boolean): string | null {
  if (!hasChanges) return null;

  const code = root.toSource(STANDARD_AST_FORMAT_OPTIONS);
  return postProcessAstOutput(code);
}
