/**
 * Functional transform to reorder cn(...) function call arguments using TypeScript AST
 *
 * Finds all calls to cn(...) and reorders the arguments to place className variables last,
 * if they exist. This ensures proper CSS cascade where the most specific styles
 * (passed via className prop) override the default styles.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Find all CallExpression nodes where callee identifier is 'cn'
 * 3. Identify className variables (matching /^className\d*$/) vs other expressions
 * 4. Check if reordering is needed (className vars not already at end)
 * 5. Reorder arguments: other expressions first, then className variables
 * 6. Generate transformed code from modified AST using ts.createPrinter
 *
 * Examples of transformations:
 *
 * Basic className reordering:
 * ```jsx
 * cn(className, 'default-styles', 'more-styles')
 * // becomes:
 * cn('default-styles', 'more-styles', className)
 * ```
 *
 * Multiple className variables:
 * ```jsx
 * cn(className, 'base', className2, 'other')
 * // becomes:
 * cn('base', 'other', className, className2)
 * ```
 *
 * Complex expressions preserved:
 * ```jsx
 * cn(className, someFunc(arg1, arg2), 'static', condition ? 'yes' : 'no')
 * // becomes:
 * cn(someFunc(arg1, arg2), 'static', condition ? 'yes' : 'no', className)
 * ```
 *
 * Template literals and nested calls:
 * ```jsx
 * cn(className, `base-${variant}`, isActive && 'active')
 * // becomes:
 * cn(`base-${variant}`, isActive && 'active', className)
 * ```
 *
 * Uses TypeScript's compiler API for reliable AST parsing and transformation.
 * Pure functional interface with no classes.
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { createTransformMetadata, executeTransform, type TransformResult } from '../utils.js';
import ts from 'typescript';

/**
 * Transform metadata
 */
export const reorderCnArgsTransform = createTransformMetadata(
  'reorder-cn-args',
  'Reorder cn() arguments to place className last',
  'quality'
);

/**
 * Reorder cn(...) function call arguments to place className variables last
 *
 * Uses TypeScript's compiler API for reliable AST parsing and transformation.
 * This is much simpler and more accurate than manual string parsing.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST
 * 2. Find all CallExpression nodes where callee is 'cn'
 * 3. Identify className variables vs other expressions
 * 4. Reorder arguments: other expressions first, then className variables
 * 5. Generate transformed code from modified AST
 *
 * Examples:
 * - Moves `className` variable to end of argument list
 * - Preserves all expressions and their order correctly
 * - Handles any valid JavaScript/TypeScript syntax
 */
export function transformReorderCnArgs(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    const warnings: string[] = [];
    let changed = false;

    try {
      /////////////////////////////////////////////////////////////////////////////////
      // Phase 1: Parse TypeScript AST
      // Parse the source code into a TypeScript AST tree to enable precise
      // manipulation of function call expressions.
      /////////////////////////////////////////////////////////////////////////////////
      const sourceFile = ts.createSourceFile(
        'temp.tsx',
        input,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      /////////////////////////////////////////////////////////////////////////////////
      // Phase 2: Create AST Transformer
      // Build a visitor function that traverses the AST and identifies cn() calls
      // for argument reordering transformation.
      /////////////////////////////////////////////////////////////////////////////////
      const transformer: ts.TransformerFactory<ts.SourceFile> = context => {
        return sourceFile => {
          function visitNode(node: ts.Node): ts.Node {
            /////////////////////////////////////////////////////////////////////////////////
            // Phase 3: Identify cn() Function Calls
            // Check if current node is a CallExpression with identifier 'cn'
            // Only process nodes that match this exact pattern.
            /////////////////////////////////////////////////////////////////////////////////
            if (
              ts.isCallExpression(node) &&
              ts.isIdentifier(node.expression) &&
              node.expression.text === 'cn'
            ) {
              const args = Array.from(node.arguments);
              if (args.length <= 1) return node;

              /////////////////////////////////////////////////////////////////////////////////
              // Phase 4: Classify Arguments
              // Separate className variables (/^className\d*$/) from other expressions
              // to determine if reordering is needed.
              /////////////////////////////////////////////////////////////////////////////////
              const classNameArgs = args.filter(
                arg => ts.isIdentifier(arg) && /^className\d*$/.test(arg.text)
              );
              const otherArgs = args.filter(
                arg => !ts.isIdentifier(arg) || !/^className\d*$/.test(arg.text)
              );

              if (classNameArgs.length === 0) return node;

              /////////////////////////////////////////////////////////////////////////////////
              // Phase 5: Check Current Order
              // Determine if className variables are already at the end of the argument list
              // If so, no transformation is needed.
              /////////////////////////////////////////////////////////////////////////////////
              const lastOtherIndex = args.findLastIndex(
                arg => !ts.isIdentifier(arg) || !/^className\d*$/.test(arg.text)
              );
              const firstClassNameIndex = args.findIndex(
                arg => ts.isIdentifier(arg) && /^className\d*$/.test(arg.text)
              );

              if (lastOtherIndex < firstClassNameIndex) return node;

              /////////////////////////////////////////////////////////////////////////////////
              // Phase 6: Reorder Arguments
              // Create new CallExpression with reordered arguments:
              // - Other expressions first (preserving their relative order)
              // - className variables last (preserving their relative order)
              /////////////////////////////////////////////////////////////////////////////////
              changed = true;
              warnings.push('Reordered cn() arguments to place className variables last');

              return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                ...otherArgs,
                ...classNameArgs,
              ]);
            }

            return ts.visitEachChild(node, visitNode, context);
          }

          return ts.visitNode(sourceFile, visitNode) as ts.SourceFile;
        };
      };

      /////////////////////////////////////////////////////////////////////////////////
      // Phase 7: Apply Transformation and Generate Code
      // Execute the AST transformation and convert the modified AST back to source code
      // using TypeScript's printer with consistent formatting.
      /////////////////////////////////////////////////////////////////////////////////
      const result = ts.transform(sourceFile, [transformer]);
      const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        removeComments: false,
      });
      const content = printer.printFile(result.transformed[0]);
      result.dispose();

      return { content, changed, warnings };
    } catch (error) {
      // Fallback: return original content if parsing fails
      return {
        content: input,
        changed: false,
        warnings: [
          `TypeScript AST parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  });
}
