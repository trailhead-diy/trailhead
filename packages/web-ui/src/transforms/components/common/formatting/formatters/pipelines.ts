/**
 * Pre-composed formatting pipelines
 */

import { pipe } from './composition.js'
import {
  fixImportSemicolons,
  normalizeImportSpacing,
  ensureBlankLineAfterImports,
} from './functions/imports.js'
import {
  reorderClassNameArgs,
  restoreCnCallsForSemanticTokens,
  preserveMultilineCnCalls,
} from './functions/classnames.js'
import { fixFunctionEndingSemicolons } from './functions/semicolons.js'

/**
 * Standard AST post-processing pipeline
 * Applies all formatting rules in the correct order for AST-generated code
 */
export const standardASTPostProcessing = pipe(
  fixImportSemicolons,
  reorderClassNameArgs,
  restoreCnCallsForSemanticTokens,
  preserveMultilineCnCalls,
  fixFunctionEndingSemicolons,
  normalizeImportSpacing,
  ensureBlankLineAfterImports
)

/**
 * Minimal formatting pipeline
 * Only applies essential formatting for basic cleanup
 */
export const minimalFormatting = pipe(
  fixImportSemicolons,
  normalizeImportSpacing,
  ensureBlankLineAfterImports
)

/**
 * Class-focused formatting pipeline
 * Focuses on className-related formatting without other changes
 */
export const classNameFormatting = pipe(
  reorderClassNameArgs,
  restoreCnCallsForSemanticTokens,
  preserveMultilineCnCalls
)

/**
 * Import-only formatting pipeline
 * Only formats import statements
 */
export const importFormatting = pipe(
  fixImportSemicolons,
  normalizeImportSpacing,
  ensureBlankLineAfterImports
)
