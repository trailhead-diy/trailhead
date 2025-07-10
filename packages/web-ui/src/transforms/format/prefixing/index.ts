/**
 * Functional transform to add Catalyst prefix to component names, types, and imports
 *
 * Transforms React components to use consistent Catalyst naming conventions by:
 * 1. Adding "Catalyst" prefix to component function names
 * 2. Adding "Catalyst" prefix to TypeScript type definitions
 * 3. Updating import paths to use catalyst- prefix
 * 4. Ensuring prop types are properly exported
 * 5. Protecting Headless UI imports from transformation
 *
 * Examples of transformations:
 *
 * Function exports:
 * ```
 * export function Button(props: ButtonProps) { ... }
 * // becomes:
 * export function CatalystButton(props: CatalystButtonProps) { ... }
 * ```
 *
 * Type definitions:
 * ```
 * type ButtonProps = { color?: string; }
 * // becomes:
 * export type CatalystButtonProps = { color?: string; }
 * ```
 *
 * Import statements:
 * ```
 * import { Link } from './link'
 * // becomes:
 * import { CatalystLink } from './catalyst-link'
 * ```
 *
 * Component parameter types:
 * ```
 * export const CatalystButton = forwardRef(function CatalystButton(
 *   { color, ...props }: ButtonProps,
 *   ref: React.ForwardedRef<HTMLElement>
 * ) {
 * // becomes:
 * export const CatalystButton = forwardRef(function CatalystButton(
 *   { color, ...props }: CatalystButtonProps,
 *   ref: React.ForwardedRef<HTMLElement>
 * ) {
 * ```
 *
 * Headless UI protection (NEVER transforms these):
 * ```
 * import * as Headless from '@headlessui/react'
 *
 * // These are NEVER transformed:
 * Omit<Headless.ButtonProps, 'as' | 'className'>  // ← stays as-is
 * Headless.Dialog                                  // ← stays as-is
 * Headless.DialogTitle                             // ← stays as-is
 * ```
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { createTransformMetadata, executeTransform, type TransformResult } from '../../utils.js';
import {
  createASTContext,
  processExportDeclarations,
  buildComprehensiveMapping,
  detectHeadlessReferences,
  mapTypeAliases,
  generateTransformedCode,
} from './core.js';
import { processImportDeclarations } from './imports.js';
import {
  updateFunctionParameterTypes,
  updateTypeofUsages,
  updateJSXReferences,
  updateTypeReferences,
  updateDirectIdentifiers,
} from './references.js';
import { updateTypeAliasDeclarations } from './types.js';

/**
 * Transform metadata
 */
export const catalystPrefixTransform = createTransformMetadata(
  'catalyst-prefix',
  'Add Catalyst prefix to component names',
  'format'
);

/**
 * Add Catalyst prefix to component names, types, and imports using AST transformation
 *
 * Examples:
 * From:  export function Button(props: ButtonProps)
 * To:    export function CatalystButton(props: CatalystButtonProps)
 *
 * From:  type ButtonProps = {...}
 * To:    export type CatalystButtonProps = {...}
 *
 * From:  import { Link } from './link'
 * To:    import { CatalystLink } from './catalyst-link'
 */
export function transformCatalystPrefix(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    // Initialize AST context
    const contextResult = createASTContext(input);
    if (!contextResult.success) {
      return { content: input, changed: false, warnings: [contextResult.error.message] };
    }

    const context = contextResult.value;

    // Execute transformation phases
    processExportDeclarations(context);
    buildComprehensiveMapping(context);
    detectHeadlessReferences(context);
    mapTypeAliases(context);
    processImportDeclarations(context);
    updateFunctionParameterTypes(context);
    updateTypeofUsages(context);
    updateJSXReferences(context);
    updateTypeReferences(context);
    updateDirectIdentifiers(context);
    updateTypeAliasDeclarations(context);

    // Generate transformed code
    const hasChanges = context.changes.length > 0;
    if (hasChanges) {
      const transformed = generateTransformedCode(context);
      return { content: transformed, changed: true, warnings: context.warnings };
    }

    return { content: input, changed: false, warnings: context.warnings };
  });
}
