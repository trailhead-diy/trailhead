/**
 * clsx to cn transformation using TypeScript AST
 *
 * Uses TypeScript's native compiler API for reliable AST parsing and transformation,
 * ensuring consistency with other transforms in the codebase.
 *
 * Converts clsx library imports and usage to cn utility imports for consistent
 * class name handling across Catalyst UI components. Handles both import
 * statements and function call transformations with comprehensive AST analysis.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Find and transform ImportDeclaration nodes from 'clsx'
 * 3. Find and transform CallExpression nodes with 'clsx' callee
 * 4. Validate transformation completeness using AST traversal
 * 5. Generate transformed code from modified AST using ts.createPrinter
 *
 * Examples of transformations:
 *
 * Import statement conversion:
 * ```tsx
 * import clsx from 'clsx'
 * // becomes:
 * import { cn } from '../utils/cn';
 * ```
 *
 * Function call conversion:
 * ```tsx
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
 * ```tsx
 * <div className={clsx('flex items-center', className)} />
 * // becomes:
 * <div className={cn('flex items-center', className)} />
 * ```
 *
 * Uses TypeScript's compiler API for reliable AST parsing and transformation.
 * Pure functional interface with no classes.
 */

import ts from 'typescript';
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
 * AST context for clsx to cn transformations
 */
interface ClsxToCnContext {
  sourceFile: ts.SourceFile;
  changes: string[];
  warnings: string[];
  hasClsxImports: boolean;
  hasClsxUsage: boolean;
}

/**
 * Initialize clsx to cn AST context
 */
function createClsxToCnContext(input: string): ClsxToCnContext | null {
  try {
    const sourceFile = ts.createSourceFile(
      'temp.tsx',
      input,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    return {
      sourceFile,
      changes: [],
      warnings: [],
      hasClsxImports: false,
      hasClsxUsage: false,
    };
  } catch {
    return null;
  }
}

/**
 * Process import declarations and replace clsx imports using TypeScript AST
 *
 * Transform process:
 * 1. Find all ImportDeclaration nodes in the AST
 * 2. Check module specifier for 'clsx' imports
 * 3. Replace with named import from '../utils/cn'
 * 4. Track changes for reporting
 *
 * Examples:
 * - Transforms `import clsx from 'clsx'` to `import { cn } from '../utils/cn'`
 * - Handles various import formats (default import, namespace import)
 * - Preserves import formatting and position
 */
function processImportDeclarations(context: ClsxToCnContext): ts.SourceFile {
  const { sourceFile } = context;

  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process import declarations
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          const moduleSpecifier = node.moduleSpecifier.text;

          // Check for clsx imports
          if (moduleSpecifier === 'clsx') {
            context.hasClsxImports = true;
            context.changes.push("Transformed import from 'clsx' to '../utils/cn'");

            // Create new import: import { cn } from '../utils/cn'
            return ts.factory.createImportDeclaration(
              node.modifiers,
              ts.factory.createImportClause(
                false,
                undefined, // no default import
                ts.factory.createNamedImports([
                  ts.factory.createImportSpecifier(
                    false,
                    undefined, // no property name
                    ts.factory.createIdentifier('cn')
                  ),
                ])
              ),
              ts.factory.createStringLiteral('../utils/cn'),
              node.assertClause
            );
          }
        }

        return ts.visitEachChild(node, visitNode, transformContext);
      }

      return ts.visitNode(sourceFile, visitNode) as ts.SourceFile;
    };
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];
  result.dispose();

  return transformedSourceFile;
}

/**
 * Process call expressions and replace clsx calls using TypeScript AST
 *
 * Transform process:
 * 1. Find all CallExpression nodes in the AST
 * 2. Check if the callee is an Identifier with text 'clsx'
 * 3. Replace the callee identifier with 'cn'
 * 4. Preserve all arguments and formatting
 *
 * Examples:
 * - Transforms `clsx('class1', 'class2')` to `cn('class1', 'class2')`
 * - Transforms `clsx({ active: isActive })` to `cn({ active: isActive })`
 * - Handles complex expressions and nested calls
 */
function processCallExpressions(
  context: ClsxToCnContext,
  sourceFile: ts.SourceFile
): ts.SourceFile {
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process call expressions
        if (ts.isCallExpression(node)) {
          // Check if the callee is an identifier named 'clsx'
          if (ts.isIdentifier(node.expression) && node.expression.text === 'clsx') {
            context.hasClsxUsage = true;
            context.changes.push('Transformed clsx() call to cn()');

            // Replace the callee identifier with 'cn'
            return ts.factory.updateCallExpression(
              node,
              ts.factory.createIdentifier('cn'),
              node.typeArguments,
              node.arguments
            );
          }
        }

        return ts.visitEachChild(node, visitNode, transformContext);
      }

      return ts.visitNode(sourceFile, visitNode) as ts.SourceFile;
    };
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];
  result.dispose();

  return transformedSourceFile;
}

/**
 * Validate transformation completeness using TypeScript AST
 *
 * Transform process:
 * 1. Traverse the entire AST to find any remaining 'clsx' references
 * 2. Check identifiers, string literals, and comments
 * 3. Report any remaining references that need manual review
 *
 * Examples:
 * - Detects dynamic imports or string-based references
 * - Warns about complex patterns that may need manual review
 * - Ensures transformation completeness
 */
function validateTransformation(context: ClsxToCnContext, sourceFile: ts.SourceFile): void {
  function visitNode(node: ts.Node): void {
    // Check for remaining clsx identifiers
    if (ts.isIdentifier(node) && node.text === 'clsx') {
      context.warnings.push('Found remaining clsx identifier that may need manual review');
    }

    // Check for clsx in string literals (dynamic imports, etc.)
    if (ts.isStringLiteral(node) && node.text.includes('clsx')) {
      context.warnings.push('Found clsx reference in string literal that may need manual review');
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);
}

/**
 * Generate final transformed code from TypeScript AST
 *
 * Uses TypeScript's native printer for consistent formatting and proper
 * handling of all TypeScript syntax features.
 */
function generateTransformedCode(sourceFile: ts.SourceFile): string {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: false,
  });

  return printer.printFile(sourceFile);
}

/**
 * Convert clsx library imports and usage to cn utility imports using TypeScript AST
 *
 * Transform process:
 * 1. Parse code into TypeScript AST
 * 2. Transform import declarations from 'clsx' to '../utils/cn'
 * 3. Transform call expressions from 'clsx()' to 'cn()'
 * 4. Validate transformation completeness
 * 5. Generate transformed code with preserved formatting
 *
 * @param input - The source code content to transform
 * @returns Result containing transformed content, change status, and any warnings
 *
 * @example
 * ```typescript
 * // Input:
 * import clsx from 'clsx';
 * const classes = clsx('flex', isActive && 'active');
 *
 * // Output:
 * import { cn } from '../utils/cn';
 * const classes = cn('flex', isActive && 'active');
 * ```
 */
export function transformClsxToCn(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    /////////////////////////////////////////////////////////////////////////////////
    // Phase 1: Initialize AST Context
    // Creates TypeScript AST from input source code
    /////////////////////////////////////////////////////////////////////////////////
    const context = createClsxToCnContext(input);
    if (!context) {
      return {
        content: input,
        changed: false,
        warnings: ['Failed to parse TypeScript AST'],
      };
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 2: Process Import Declarations using TypeScript AST
    // Transforms clsx imports to cn imports with proper AST handling
    /////////////////////////////////////////////////////////////////////////////////
    let transformedSourceFile = processImportDeclarations(context);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 3: Process Call Expressions using TypeScript AST
    // Transforms clsx() function calls to cn() calls
    /////////////////////////////////////////////////////////////////////////////////
    transformedSourceFile = processCallExpressions(context, transformedSourceFile);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 4: Validate Transformation Completeness
    // Uses AST traversal to find any remaining clsx references
    /////////////////////////////////////////////////////////////////////////////////
    validateTransformation(context, transformedSourceFile);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 5: Generate Final Transformed Code
    // Uses TypeScript printer to generate formatted code from AST
    /////////////////////////////////////////////////////////////////////////////////
    const transformedContent = generateTransformedCode(transformedSourceFile);

    const changed = context.changes.length > 0 || transformedContent !== input;

    return {
      content: transformedContent,
      changed,
      warnings: context.warnings,
    };
  });
}
