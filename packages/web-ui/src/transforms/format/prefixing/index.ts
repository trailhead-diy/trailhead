/**
 * Catalyst component prefix transformation using TypeScript AST
 *
 * Uses TypeScript's native compiler API for reliable AST parsing and transformation,
 * ensuring consistency with other transforms in the codebase.
 *
 * Main orchestrator that coordinates all phases of the Catalyst prefix transformation:
 * 1. Export declaration processing and name mapping
 * 2. Headless UI reference detection and protection
 * 3. Type alias mapping and Props suffix handling
 * 4. Import declaration transformation
 * 5. Comprehensive reference updates throughout the AST
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Initialize transformation context with mappings and protection sets
 * 3. Execute transformation phases in sequence
 * 4. Generate final transformed code from modified AST
 * 5. Provide detailed change reporting and warnings
 *
 * Examples of transformations:
 *
 * Complete component transformation:
 * ```tsx
 * // Before:
 * import { forwardRef } from 'react';
 * import { Button as HeadlessButton } from '@headlessui/react';
 *
 * type ButtonProps = {
 *   color: 'blue' | 'red';
 *   children: React.ReactNode;
 * };
 *
 * export function Button({ color, children }: ButtonProps) {
 *   return <button className={`btn-${color}`}>{children}</button>;
 * }
 *
 * // After:
 * import { forwardRef } from 'react';
 * import { Button as HeadlessButton } from '@headlessui/react';
 *
 * type CatalystButtonProps = {
 *   color: 'blue' | 'red';
 *   children: React.ReactNode;
 * };
 *
 * export function CatalystButton({ color, children }: CatalystButtonProps) {
 *   return <button className={`btn-${color}`}>{children}</button>;
 * }
 * ```
 *
 * Cross-file import transformation:
 * ```tsx
 * // Before:
 * import { Button, Input } from './components';
 *
 * // After:
 * import { CatalystButton, CatalystInput } from './catalyst-components';
 * ```
 *
 * Headless UI protection:
 * ```tsx
 * import * as Headless from '@headlessui/react';
 * // Headless.Button and all Headless references remain unchanged
 * ```
 *
 * Uses TypeScript's compiler API for reliable AST parsing and transformation.
 * Pure functional interface with no classes.
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { createTransformMetadata, executeTransform, type TransformResult } from '../../utils.js';
import {
  createASTContext,
  processExportDeclarations,
  detectHeadlessReferences,
  mapTypeAliases,
  generateTransformedCode,
} from './core.js';
import {
  updateFunctionParameterTypes,
  updateTypeofUsages,
  updateJSXReferences,
  updateTypeReferences,
  updateDirectIdentifiers,
} from './references.js';
import { processImportDeclarations } from './imports.js';

/**
 * Transform metadata
 */
export const catalystPrefixTransform = createTransformMetadata(
  'catalyst-prefix',
  'Add Catalyst prefix to component names and references',
  'format'
);

/**
 * Add Catalyst prefix to component names and references using TypeScript AST
 *
 * Comprehensive transformation that processes an entire component file to add
 * Catalyst prefixes while protecting Headless UI references and maintaining
 * code functionality and type safety.
 *
 * Transform process:
 * 1. Initialize TypeScript AST context with mapping and protection systems
 * 2. Process export declarations to identify and prefix component functions
 * 3. Detect and protect all Headless UI imports and references
 * 4. Map type aliases and generate automatic Props suffix mappings
 * 5. Transform import declarations with path and specifier updates
 * 6. Update all references throughout the AST in multiple phases:
 *    - Function parameter types in component definitions
 *    - Typeof expressions in utility types
 *    - JSX elements and expressions
 *    - Type references and annotations
 *    - Direct identifier references with comprehensive exclusions
 * 7. Generate final transformed code with consistent formatting
 *
 * Examples:
 * - Transforms component exports to use Catalyst prefix
 * - Updates all internal references to match new names
 * - Protects Headless UI namespace from any modifications
 * - Handles complex component patterns like forwardRef
 * - Maintains type safety throughout transformation
 */
export function transformCatalystPrefix(input: string): Result<TransformResult, CLIError> {
  // Initialize context first to handle errors properly
  const contextResult = createASTContext(input);
  if (!contextResult.success) {
    return { success: false, error: contextResult.error };
  }

  return executeTransform(() => {
    let context = contextResult.value;

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 1: Initialize TypeScript AST Context
    //
    // From:  (input source code)
    // To:    (TypeScript AST with context objects)
    //
    /////////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 2: Export Declaration Processing
    //
    // From:  export function Button() { }
    // To:    export function CatalystButton() { }
    //
    /////////////////////////////////////////////////////////////////////////////////
    context.sourceFile = processExportDeclarations(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 3: Headless UI Protection
    //
    // From:  import { Button } from '@headlessui/react'
    // To:    (protected set: Button - no transformation)
    //
    /////////////////////////////////////////////////////////////////////////////////
    detectHeadlessReferences(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 4: Type Alias Mapping
    //
    // From:  type ButtonProps = { children: React.ReactNode }
    // To:    type CatalystButtonProps = { children: React.ReactNode }
    //
    /////////////////////////////////////////////////////////////////////////////////
    context.sourceFile = mapTypeAliases(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 5: Import Declaration Processing
    //
    // From:  import { Button } from './button'
    // To:    import { CatalystButton } from './catalyst-button'
    //
    /////////////////////////////////////////////////////////////////////////////////
    context.sourceFile = processImportDeclarations(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 6: Reference Updates - Function Parameter Types
    //
    // From:  function CatalystButton({ color }: ButtonProps) { }
    // To:    function CatalystButton({ color }: CatalystButtonProps) { }
    //
    /////////////////////////////////////////////////////////////////////////////////
    context.sourceFile = updateFunctionParameterTypes(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 7: Reference Updates - Typeof Expressions
    //
    // From:  ComponentPropsWithoutRef<typeof Button>
    // To:    ComponentPropsWithoutRef<typeof CatalystButton>
    //
    /////////////////////////////////////////////////////////////////////////////////
    context.sourceFile = updateTypeofUsages(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 8: Reference Updates - JSX Elements
    //
    // From:  <Button color="blue">Click me</Button>
    // To:    <CatalystButton color="blue">Click me</CatalystButton>
    //
    /////////////////////////////////////////////////////////////////////////////////
    context.sourceFile = updateJSXReferences(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 9: Reference Updates - Type References
    //
    // From:  React.ComponentProps<Button>
    // To:    React.ComponentProps<CatalystButton>
    //
    /////////////////////////////////////////////////////////////////////////////////
    context.sourceFile = updateTypeReferences(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 10: Reference Updates - Direct Identifiers
    //
    // From:  const MyButton = Button
    // To:    const MyButton = CatalystButton
    //
    /////////////////////////////////////////////////////////////////////////////////
    context.sourceFile = updateDirectIdentifiers(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 11: Code Generation
    //
    // From:  (modified TypeScript AST)
    // To:    (final transformed source code)
    //
    /////////////////////////////////////////////////////////////////////////////////
    const content = generateTransformedCode(context.sourceFile);

    return {
      content,
      changed: context.changes.length > 0,
      warnings: context.warnings,
    };
  });
}
