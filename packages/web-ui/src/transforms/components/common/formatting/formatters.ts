/**
 * Composable Formatting System
 *
 * This module re-exports the modular formatting system:
 * - Individual formatting functions from ./formatters/functions/
 * - Composition utilities from ./formatters/composition
 * - Pre-composed pipelines from ./formatters/pipelines
 */

// Export composition utilities
export {
  pipe,
  compose,
  createPostProcessor,
  conditionalFormatter,
} from './formatters/composition.js';

// Export individual formatting functions
export {
  fixImportSemicolons,
  normalizeImportSpacing,
  ensureBlankLineAfterImports,
} from './formatters/functions/imports.js';

export {
  reorderClassNameArgs,
  restoreCnCallsForSemanticTokens,
  preserveMultilineCnCalls,
} from './formatters/functions/classnames.js';

export { fixFunctionEndingSemicolons } from './formatters/functions/semicolons.js';

export {
  normalizeBlankLines,
  addFunctionSpacing,
  removeTrailingWhitespace,
} from './formatters/functions/spacing.js';

// Export pre-composed pipelines
export {
  standardASTPostProcessing,
  minimalFormatting,
  classNameFormatting,
  importFormatting,
} from './formatters/pipelines.js';
