/**
 * Functional transform to add semantic color tokens to Catalyst UI components
 *
 * Adds semantic color tokens (primary, secondary, destructive, accent, muted) to
 * component color objects to enable theme-aware styling across all components.
 *
 * Component detection and transformation:
 * 1. Detects component type by analyzing function signatures and CSS patterns
 * 2. Adds appropriate semantic color tokens for each component type
 * 3. Preserves existing color definitions while adding semantic tokens
 * 4. Uses component-specific color patterns for consistent theming
 *
 * Examples of transformations:
 *
 * Button component colors object:
 * ```
 * colors: {
 *   zinc: [...],
 *   blue: [...],
 *   // Adds these semantic tokens:
 *   primary: [
 *     'text-white [--btn-bg:var(--color-blue-600)] [--btn-border:var(--color-blue-700)]/90',
 *     '[--btn-icon:var(--color-blue-300)] data-active:[--btn-icon:var(--color-blue-200)]',
 *   ],
 *   secondary: [
 *     'text-white [--btn-bg:var(--color-zinc-600)] [--btn-border:var(--color-zinc-700)]/90',
 *     '[--btn-icon:var(--color-zinc-300)] data-active:[--btn-icon:var(--color-zinc-200)]',
 *   ],
 *   destructive: [
 *     'text-white [--btn-bg:var(--color-red-600)] [--btn-border:var(--color-red-700)]/90',
 *     '[--btn-icon:var(--color-red-300)] data-active:[--btn-icon:var(--color-red-200)]',
 *   ],
 *   accent: [
 *     'text-white [--btn-bg:var(--color-purple-600)] [--btn-border:var(--color-purple-700)]/90',
 *     '[--btn-icon:var(--color-purple-300)] data-active:[--btn-icon:var(--color-purple-200)]',
 *   ],
 *   muted: [
 *     'text-white [--btn-bg:var(--color-gray-600)] [--btn-border:var(--color-gray-700)]/90',
 *     '[--btn-icon:var(--color-gray-300)] data-active:[--btn-icon:var(--color-gray-200)]',
 *   ]
 * }
 * ```
 *
 * Badge component colors object:
 * ```
 * const colors = {
 *   zinc: 'bg-zinc-500/15...',
 *   blue: 'bg-blue-500/15...',
 *   // Adds these semantic tokens:
 *   primary: 'bg-primary-500/15 text-primary-700 group-data-hover:bg-primary-500/25 dark:bg-primary-500/10',
 *   secondary: 'bg-secondary-500/15 text-secondary-700 group-data-hover:bg-secondary-500/25 dark:bg-secondary-500/10',
 *   destructive: 'bg-destructive-500/15 text-destructive-700 group-data-hover:bg-destructive-500/25 dark:bg-destructive-500/10'
 * }
 * ```
 *
 * Switch component colors object:
 * ```
 * const colors = {
 *   zinc: [...],
 *   // Adds these semantic tokens:
 *   primary: [
 *     '[--switch-bg-ring:var(--color-blue-600)]/90 [--switch-bg:var(--color-blue-500)]',
 *     '[--switch:white] [--switch-ring:var(--color-blue-600)]/90 [--switch-shadow:var(--color-blue-900)]/20',
 *   ]
 * }
 * ```
 *
 * Uses CLI framework Result types for consistent error handling.
 * Pure functional interface with no classes.
 */

import type { Result, CLIError } from '@esteban-url/cli/core';
import { createTransformMetadata, executeTransform, type TransformResult } from '../../utils.js';
import { executeSemanticColorsTransform } from './transform.js';

/**
 * Transform metadata
 */
export const semanticColorsTransform = createTransformMetadata(
  'semantic-colors',
  'Add semantic color tokens to color objects',
  'semantic'
);

/**
 * Add semantic color tokens (primary, secondary, destructive, accent, muted) to component color objects
 *
 * Transform process:
 * 1. Detect component type by analyzing function signatures and CSS patterns
 * 2. Generate appropriate semantic color tokens for the detected component
 * 3. Locate colors object in the component (nested or direct)
 * 4. Add semantic tokens while preserving existing color definitions
 *
 * Examples:
 * - Button colors: `zinc: [...]` → adds `primary: ['text-white [--btn-bg:var(--color-blue-600)]...']`
 * - Badge colors: `zinc: 'bg-zinc-500/15...'` → adds `primary: 'bg-primary-500/15 text-primary-700...'`
 * - Switch colors: `zinc: [...]` → adds `primary: ['[--switch-bg-ring:var(--color-blue-600)]/90...']`
 */
export function transformSemanticColors(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    const result = executeSemanticColorsTransform(input);
    return result;
  });
}
