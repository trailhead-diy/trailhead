/**
 * @fileoverview Flatten Nested CN Transform
 *
 * This transform flattens nested cn() and clsx() calls within cn() calls.
 * Examples:
 * - cn(clsx(a, b), c) → cn(a, b, c)
 * - cn(cn(a, b), c) → cn(a, b, c)
 * - cn(a, clsx(b, c), d) → cn(a, b, c, d)
 */

import ts from 'typescript';
import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { executeTransform, type TransformResult } from '../../utils.js';

/**
 * Context for tracking flatten nested cn transform state
 */
interface FlattenNestedCnContext {
  sourceFile: ts.SourceFile;
  changes: string[];
  warnings: string[];
}

/**
 * Configuration for flatten nested cn transform
 */
interface FlattenNestedCnConfig {
  enabled: boolean;
}

/**
 * Creates the flatten nested cn context
 */
function createFlattenNestedCnContext(
  sourceFile: ts.SourceFile,
  _config: FlattenNestedCnConfig
): FlattenNestedCnContext {
  return {
    sourceFile,
    changes: [],
    warnings: [],
  };
}

/**
 * Checks if a call expression is a cn() or clsx() call
 */
function isCnOrClsxCall(node: ts.CallExpression): boolean {
  if (!ts.isIdentifier(node.expression)) return false;
  const identifier = node.expression.text;
  return identifier === 'cn' || identifier === 'clsx';
}

/**
 * Flattens arguments from nested cn/clsx calls, handling conditional expressions
 */
function flattenArguments(args: ts.NodeArray<ts.Expression>): ts.Expression[] {
  const flattened: ts.Expression[] = [];

  for (const arg of args) {
    if (ts.isCallExpression(arg) && isCnOrClsxCall(arg)) {
      // Recursively flatten nested calls
      const nestedFlattened = flattenArguments(arg.arguments);
      flattened.push(...nestedFlattened);
    } else if (ts.isConditionalExpression(arg)) {
      // Handle conditional expressions: condition ? whenTrue : whenFalse
      const condition = arg.condition;
      const whenTrue = flattenConditionalExpression(arg.whenTrue);
      const whenFalse = flattenConditionalExpression(arg.whenFalse);

      // Reconstruct the conditional with flattened branches
      flattened.push(
        ts.factory.createConditionalExpression(
          condition,
          arg.questionToken,
          whenTrue,
          arg.colonToken,
          whenFalse
        )
      );
    } else {
      flattened.push(arg);
    }
  }

  return flattened;
}

/**
 * Flattens a single expression that might be a clsx/cn call
 */
function flattenConditionalExpression(expr: ts.Expression): ts.Expression {
  if (ts.isCallExpression(expr) && isCnOrClsxCall(expr)) {
    // Convert clsx() calls to cn() but don't extract arguments here
    // since we're inside a conditional branch
    const flattened = flattenArguments(expr.arguments);
    return ts.factory.createCallExpression(ts.factory.createIdentifier('cn'), undefined, flattened);
  } else if (ts.isConditionalExpression(expr)) {
    // Recursively handle nested conditionals
    return ts.factory.createConditionalExpression(
      expr.condition,
      expr.questionToken,
      flattenConditionalExpression(expr.whenTrue),
      expr.colonToken,
      flattenConditionalExpression(expr.whenFalse)
    );
  }
  return expr;
}

/**
 * Creates a transformer that flattens nested cn/clsx calls
 */
function createFlattenNestedCnTransformer(
  context: FlattenNestedCnContext
): ts.TransformerFactory<ts.SourceFile> {
  return transformContext => {
    const visitor: ts.Visitor = (node): ts.Node => {
      // Only process cn() calls (not clsx() at top level)
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'cn' &&
        node.arguments.length > 0
      ) {
        const flattenedArgs = flattenArguments(node.arguments);

        // Check if anything actually changed by comparing the printed result
        const originalPrinter = ts.createPrinter();
        const originalText = originalPrinter.printNode(
          ts.EmitHint.Expression,
          node,
          context.sourceFile
        );

        const tempNode = ts.factory.createCallExpression(
          node.expression,
          node.typeArguments,
          flattenedArgs
        );
        const newText = originalPrinter.printNode(
          ts.EmitHint.Expression,
          tempNode,
          context.sourceFile
        );

        if (originalText !== newText) {
          context.changes.push(`Flattened nested cn/clsx calls`);
          return tempNode;
        }
      }

      return ts.visitEachChild(node, visitor, transformContext);
    };

    return sourceFile => ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
}

/**
 * Main transform function for flattening nested cn calls
 */
export function transformFlattenNestedCn(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    // Parse the source code into AST
    const sourceFile = ts.createSourceFile(
      'temp.tsx',
      input,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    // Create transform context
    const context = createFlattenNestedCnContext(sourceFile, { enabled: true });

    // Apply the transformation
    const result = ts.transform(sourceFile, [createFlattenNestedCnTransformer(context)]);
    const transformedSourceFile = result.transformed[0];

    // Generate the transformed code
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });

    const transformedCode = printer.printFile(transformedSourceFile);

    // Clean up
    result.dispose();

    return {
      content: transformedCode,
      changed: context.changes.length > 0,
      warnings: context.warnings,
    };
  });
}

/**
 * Type definitions for the transform
 */
export type { FlattenNestedCnConfig, FlattenNestedCnContext };
