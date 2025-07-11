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
      // Parses:
      //        source code string into TypeScript AST tree structure
      //        for reliable syntax analysis and transformation
      //
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
      // Creates:
      //        visitor function that will traverse AST nodes
      //        to find and transform cn() function calls
      //
      /////////////////////////////////////////////////////////////////////////////////
      const transformer: ts.TransformerFactory<ts.SourceFile> = context => {
        return sourceFile => {
          function visitNode(node: ts.Node): ts.Node {
            /////////////////////////////////////////////////////////////////////////////////
            // Phase 3: Identify cn() Function Calls
            // Finds:
            //        cn(className, 'base-styles', 'more-styles')
            //        cn(className, { 'active': isActive }, 'rounded-md')
            //        cn(className1, className2, 'flex items-center')
            //
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
              // Separates:
              //        className variables (className, className1, className2)
              //        from other expressions ('base-styles', { active: true }, variables)
              //
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
              // Checks:
              //        if className variables are already at the end
              //        if reordering is needed (className before other expressions)
              //
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
              //
              // From:  cn(className, 'base-styles', 'more-styles')
              // To:    cn('base-styles', 'more-styles', className)
              //
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
      //
      // From:  (modified AST tree)
      // To:    (transformed source code string)
      //
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
