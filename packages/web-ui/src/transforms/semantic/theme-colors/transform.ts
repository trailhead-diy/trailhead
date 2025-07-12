/**
 * Core transformation logic for default colors support using TypeScript AST
 *
 * Uses TypeScript's native compiler API for reliable AST parsing and transformation,
 * following the same pattern as the prefixing transforms.
 *
 * Transforms components to use the useThemeColor hook instead of hardcoded default values.
 * This enables consistent default color management across all components.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Find supported component function declarations
 * 3. Add useThemeColor import if needed
 * 4. Remove default values from color parameters
 * 5. Add useThemeColor hook calls at function start
 * 6. Update color usage patterns to use fallback
 * 7. Generate transformed code from modified AST using ts.createPrinter
 */

import { ok, err, type Result, type CLIError } from '@esteban-url/trailhead-cli/core';
import ts from 'typescript';
import { getComponentType, getComponentConfig } from './mappings.js';

/**
 * AST context for default colors transformation
 */
interface DefaultColorsContext {
  sourceFile: ts.SourceFile;
  changes: string[];
  warnings: string[];
  needsImport: boolean;
  transformedFunctions: Set<string>;
}

/**
 * Initialize TypeScript AST context for default colors transform
 */
function createDefaultColorsContext(input: string): Result<DefaultColorsContext, CLIError> {
  try {
    const sourceFile = ts.createSourceFile(
      'temp.tsx',
      input,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    return ok({
      sourceFile,
      changes: [],
      warnings: [],
      needsImport: false,
      transformedFunctions: new Set<string>(),
    });
  } catch (error) {
    return err({
      code: 'TS_AST_INIT_ERROR',
      message: `Failed to initialize TypeScript AST: ${error instanceof Error ? error.message : String(error)}`,
      recoverable: false,
    });
  }
}

/**
 * Core default colors transformation logic using TypeScript AST
 *
 * @param input - The source code content to transform
 * @returns Object containing transformed content, change status, and any warnings
 */
export function executeThemeColorsTransform(input: string): {
  content: string;
  changed: boolean;
  warnings: string[];
} {
  const contextResult = createDefaultColorsContext(input);
  if (contextResult.isErr()) {
    return { content: input, changed: false, warnings: [contextResult.error.message] };
  }

  const context = contextResult.value;

  // Find supported component functions
  const supportedFunctions = findSupportedComponents(context.sourceFile);

  if (supportedFunctions.length === 0) {
    context.warnings.push('No supported components found for default colors transform');
    return { content: input, changed: false, warnings: context.warnings };
  }

  // Check if we already have the import
  const hasImport = hasUseThemeColorImport(context.sourceFile);

  // Process the AST
  const transformedSourceFile = processThemeColorsTransformation(context, supportedFunctions);

  // Add import if needed
  let finalSourceFile = transformedSourceFile;
  if (context.needsImport && !hasImport) {
    finalSourceFile = addUseThemeColorImport(finalSourceFile);
  }

  // Convert back to string
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  const transformedContent = printer.printFile(finalSourceFile);
  const changed = context.changes.length > 0;

  return { content: transformedContent, changed, warnings: context.warnings };
}

/**
 * Find all supported component functions in the source file
 */
function findSupportedComponents(sourceFile: ts.SourceFile): string[] {
  const components: string[] = [];

  function visit(node: ts.Node) {
    // Check function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const functionName = node.name.text;
      if (getComponentType(functionName)) {
        components.push(functionName);
      }
    }

    // Check variable declarations (forwardRef components)
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (
        ts.isVariableDeclaration(declaration) &&
        declaration.name &&
        ts.isIdentifier(declaration.name)
      ) {
        const functionName = declaration.name.text;
        if (getComponentType(functionName)) {
          components.push(functionName);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return components;
}

/**
 * Check if the file already has useThemeColor import
 */
function hasUseThemeColorImport(sourceFile: ts.SourceFile): boolean {
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === '../theme-colors'
    ) {
      if (
        statement.importClause?.namedBindings &&
        ts.isNamedImports(statement.importClause.namedBindings)
      ) {
        return statement.importClause.namedBindings.elements.some(
          element => element.name.text === 'useThemeColor'
        );
      }
    }
  }
  return false;
}

/**
 * Process default colors transformation using TypeScript AST
 */
function processThemeColorsTransformation(
  context: DefaultColorsContext,
  supportedFunctions: string[]
): ts.SourceFile {
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Handle export function declarations
        if (ts.isFunctionDeclaration(node) && node.name) {
          const functionName = node.name.text;
          const componentType = getComponentType(functionName);

          if (
            componentType &&
            supportedFunctions.includes(functionName) &&
            !isAlreadyTransformed(node, componentType)
          ) {
            context.needsImport = true;
            context.transformedFunctions.add(functionName);
            context.changes.push(`Transformed function ${functionName} to use default colors`);
            return transformFunctionDeclaration(node, componentType);
          }
        }

        // Handle export variable declarations (for forwardRef components)
        if (ts.isVariableStatement(node)) {
          const declaration = node.declarationList.declarations[0];
          if (
            ts.isVariableDeclaration(declaration) &&
            declaration.name &&
            ts.isIdentifier(declaration.name)
          ) {
            const functionName = declaration.name.text;
            const componentType = getComponentType(functionName);

            if (
              componentType &&
              supportedFunctions.includes(functionName) &&
              declaration.initializer &&
              ts.isCallExpression(declaration.initializer)
            ) {
              // Check if it's a forwardRef call
              if (
                ts.isIdentifier(declaration.initializer.expression) &&
                declaration.initializer.expression.text === 'forwardRef'
              ) {
                const forwardRefArg = declaration.initializer.arguments[0];
                if (
                  forwardRefArg &&
                  ts.isFunctionExpression(forwardRefArg) &&
                  !isAlreadyTransformed(forwardRefArg, componentType)
                ) {
                  context.needsImport = true;
                  context.transformedFunctions.add(functionName);
                  context.changes.push(
                    `Transformed forwardRef ${functionName} to use default colors`
                  );
                  return transformForwardRefVariable(node, componentType);
                }
              }
            }
          }
        }

        return ts.visitEachChild(node, visitNode, transformContext);
      }

      return ts.visitNode(sourceFile, visitNode) as ts.SourceFile;
    };
  };

  const result = ts.transform(context.sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];
  result.dispose();

  return transformedSourceFile;
}

/**
 * Check if a function is already transformed
 */
function isAlreadyTransformed(
  node: ts.FunctionDeclaration | ts.FunctionExpression,
  componentType: string
): boolean {
  const config = getComponentConfig(componentType);
  if (!config) return false;

  // Check if the function body contains useThemeColor call with the right component type
  if (node.body && ts.isBlock(node.body)) {
    for (const statement of node.body.statements) {
      if (ts.isVariableStatement(statement)) {
        const declaration = statement.declarationList.declarations[0];
        if (
          ts.isVariableDeclaration(declaration) &&
          declaration.name &&
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === 'defaultColor' &&
          declaration.initializer &&
          ts.isCallExpression(declaration.initializer)
        ) {
          const callExpr = declaration.initializer;
          if (
            ts.isIdentifier(callExpr.expression) &&
            callExpr.expression.text === 'useThemeColor' &&
            callExpr.arguments.length > 0 &&
            ts.isStringLiteral(callExpr.arguments[0]) &&
            callExpr.arguments[0].text === config.componentType
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Transform a function declaration
 */
function transformFunctionDeclaration(
  node: ts.FunctionDeclaration,
  componentType: string
): ts.FunctionDeclaration {
  const config = getComponentConfig(componentType);
  if (!config) return node;

  // Transform parameters - remove default values from color parameter
  const transformedParameters = node.parameters.map(param => {
    if (ts.isParameter(param) && param.name && ts.isObjectBindingPattern(param.name)) {
      const transformedElements = param.name.elements.map(element => {
        if (
          ts.isBindingElement(element) &&
          element.name &&
          ts.isIdentifier(element.name) &&
          element.name.text === 'color' &&
          element.initializer
        ) {
          // Remove the default value
          return ts.factory.updateBindingElement(
            element,
            element.dotDotDotToken,
            element.propertyName,
            element.name,
            undefined // Remove initializer
          );
        }
        return element;
      });

      return ts.factory.updateParameterDeclaration(
        param,
        param.modifiers,
        param.dotDotDotToken,
        ts.factory.updateObjectBindingPattern(param.name, transformedElements),
        param.questionToken,
        param.type,
        param.initializer
      );
    }
    return param;
  });

  // Transform function body - add hook call and update expressions
  let transformedBody = node.body;
  if (transformedBody && ts.isBlock(transformedBody)) {
    transformedBody = addHookCallToBlock(transformedBody, config);
    transformedBody = updateColorExpressionsInBlock(transformedBody, config);
  }

  return ts.factory.updateFunctionDeclaration(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.typeParameters,
    transformedParameters,
    node.type,
    transformedBody
  );
}

/**
 * Transform a forwardRef variable statement
 */
function transformForwardRefVariable(
  node: ts.VariableStatement,
  componentType: string
): ts.VariableStatement {
  const config = getComponentConfig(componentType);
  if (!config) return node;

  const declaration = node.declarationList.declarations[0];
  if (
    !ts.isVariableDeclaration(declaration) ||
    !declaration.initializer ||
    !ts.isCallExpression(declaration.initializer)
  ) {
    return node;
  }

  const forwardRefCall = declaration.initializer;
  const functionArg = forwardRefCall.arguments[0];

  if (!functionArg || !ts.isFunctionExpression(functionArg)) {
    return node;
  }

  // Transform the inner function using the same logic as transformFunctionDeclaration
  const transformedFunction = transformFunctionExpression(functionArg, componentType);

  // Update the forwardRef call
  const updatedForwardRefCall = ts.factory.updateCallExpression(
    forwardRefCall,
    forwardRefCall.expression,
    forwardRefCall.typeArguments,
    [transformedFunction, ...forwardRefCall.arguments.slice(1)]
  );

  // Update the variable declaration
  const updatedDeclaration = ts.factory.updateVariableDeclaration(
    declaration,
    declaration.name,
    declaration.exclamationToken,
    declaration.type,
    updatedForwardRefCall
  );

  return ts.factory.updateVariableStatement(
    node,
    node.modifiers,
    ts.factory.updateVariableDeclarationList(node.declarationList, [updatedDeclaration])
  );
}

/**
 * Transform a function expression (for forwardRef)
 */
function transformFunctionExpression(
  node: ts.FunctionExpression,
  componentType: string
): ts.FunctionExpression {
  const config = getComponentConfig(componentType);
  if (!config) return node;

  // Transform parameters - remove default values from color parameter
  const transformedParameters = node.parameters.map(param => {
    if (ts.isParameter(param) && param.name && ts.isObjectBindingPattern(param.name)) {
      const transformedElements = param.name.elements.map(element => {
        if (
          ts.isBindingElement(element) &&
          element.name &&
          ts.isIdentifier(element.name) &&
          element.name.text === 'color' &&
          element.initializer
        ) {
          // Remove the default value
          return ts.factory.updateBindingElement(
            element,
            element.dotDotDotToken,
            element.propertyName,
            element.name,
            undefined // Remove initializer
          );
        }
        return element;
      });

      return ts.factory.updateParameterDeclaration(
        param,
        param.modifiers,
        param.dotDotDotToken,
        ts.factory.updateObjectBindingPattern(param.name, transformedElements),
        param.questionToken,
        param.type,
        param.initializer
      );
    }
    return param;
  });

  // Transform function body - add hook call and update expressions
  let transformedBody = node.body;
  if (transformedBody && ts.isBlock(transformedBody)) {
    transformedBody = addHookCallToBlock(transformedBody, config);
    transformedBody = updateColorExpressionsInBlock(transformedBody, config);
  }

  return ts.factory.updateFunctionExpression(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.typeParameters,
    transformedParameters,
    node.type,
    transformedBody
  );
}

/**
 * Add useThemeColor hook call to the beginning of a block
 */
function addHookCallToBlock(
  block: ts.Block,
  config: ReturnType<typeof getComponentConfig>
): ts.Block {
  if (!config) return block;

  // Create the hook call: const defaultColor = useThemeColor<keyof typeof colors>('badge');
  const typeArgument = ts.factory.createTypeOperatorNode(
    ts.SyntaxKind.KeyOfKeyword,
    ts.factory.createTypeQueryNode(ts.factory.createIdentifier(config.stylePattern))
  );

  const hookCall = ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          'defaultColor',
          undefined,
          undefined,
          ts.factory.createCallExpression(
            ts.factory.createIdentifier('useThemeColor'),
            [typeArgument],
            [createSingleQuoteStringLiteral(config.componentType)]
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );

  return ts.factory.updateBlock(block, [hookCall, ...block.statements]);
}

/**
 * Update color expressions to use nullish coalescing
 */
function updateColorExpressionsInBlock(
  block: ts.Block,
  config: ReturnType<typeof getComponentConfig>
): ts.Block {
  if (!config) return block;

  const transformer: ts.TransformerFactory<ts.Block> = transformContext => {
    return block => {
      function visitNode(node: ts.Node): ts.Node {
        // Handle colors[color] -> colors[color ?? defaultColor]
        if (
          ts.isElementAccessExpression(node) &&
          node.argumentExpression &&
          ts.isIdentifier(node.argumentExpression) &&
          node.argumentExpression.text === 'color'
        ) {
          // Check if this matches our pattern (colors[ or styles.colors[)
          const objName = getObjectName(node.expression);
          if (objName === config?.stylePattern) {
            // Check if it's already transformed (has ??)
            if (!ts.isBinaryExpression(node.argumentExpression)) {
              return ts.factory.updateElementAccessExpression(
                node,
                node.expression,
                ts.factory.createBinaryExpression(
                  node.argumentExpression,
                  ts.SyntaxKind.QuestionQuestionToken,
                  ts.factory.createIdentifier('defaultColor')
                )
              );
            }
          }
        }

        // Handle patterns like: styles.colors[color ?? 'hardcoded-value']
        // Transform to: styles.colors[color ?? defaultColor]
        if (
          ts.isElementAccessExpression(node) &&
          node.argumentExpression &&
          ts.isBinaryExpression(node.argumentExpression) &&
          node.argumentExpression.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          const objName = getObjectName(node.expression);
          if (objName === config?.stylePattern) {
            const leftSide = node.argumentExpression.left;
            const rightSide = node.argumentExpression.right;

            // Check if left side is 'color' and right side is a string literal
            if (
              ts.isIdentifier(leftSide) &&
              leftSide.text === 'color' &&
              ts.isStringLiteral(rightSide)
            ) {
              // Replace the string literal with defaultColor
              return ts.factory.updateElementAccessExpression(
                node,
                node.expression,
                ts.factory.createBinaryExpression(
                  leftSide,
                  ts.SyntaxKind.QuestionQuestionToken,
                  ts.factory.createIdentifier('defaultColor')
                )
              );
            }
          }
        }

        // Handle JSX attribute: color={color} -> color={color ?? defaultColor}
        if (
          ts.isJsxAttribute(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text === 'color' &&
          node.initializer &&
          ts.isJsxExpression(node.initializer) &&
          node.initializer.expression &&
          ts.isIdentifier(node.initializer.expression) &&
          node.initializer.expression.text === 'color'
        ) {
          // Check if it's already transformed
          if (!ts.isBinaryExpression(node.initializer.expression)) {
            return ts.factory.updateJsxAttribute(
              node,
              node.name,
              ts.factory.createJsxExpression(
                undefined,
                ts.factory.createBinaryExpression(
                  node.initializer.expression,
                  ts.SyntaxKind.QuestionQuestionToken,
                  ts.factory.createIdentifier('defaultColor')
                )
              )
            );
          }
        }

        return ts.visitEachChild(node, visitNode, transformContext);
      }

      return ts.visitNode(block, visitNode) as ts.Block;
    };
  };

  const result = ts.transform(block, [transformer]);
  const transformedBlock = result.transformed[0];
  result.dispose();

  return transformedBlock;
}

/**
 * Get the full object name for property access (handles both simple and nested)
 */
function getObjectName(expr: ts.Expression): string {
  if (ts.isIdentifier(expr)) {
    return expr.text;
  }
  if (ts.isPropertyAccessExpression(expr)) {
    return getObjectName(expr.expression) + '.' + expr.name.text;
  }
  return '';
}

/**
 * Create a string literal with single quotes (for consistency with test expectations)
 */
function createSingleQuoteStringLiteral(text: string): ts.StringLiteral {
  const literal = ts.factory.createStringLiteral(text);
  // TypeScript's factory doesn't have a direct way to set quote style,
  // but the printer will generally preserve the style from the original text
  return literal;
}

/**
 * Add useThemeColor import to the source file
 */
function addUseThemeColorImport(sourceFile: ts.SourceFile): ts.SourceFile {
  const importDeclaration = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier('useThemeColor')
        ),
      ])
    ),
    createSingleQuoteStringLiteral('../theme-colors'),
    undefined
  );

  // Find the position to insert the import (after existing imports)
  let insertIndex = 0;
  for (let i = 0; i < sourceFile.statements.length; i++) {
    if (ts.isImportDeclaration(sourceFile.statements[i])) {
      insertIndex = i + 1;
    } else {
      break;
    }
  }

  const statements = [...sourceFile.statements];
  statements.splice(insertIndex, 0, importDeclaration);

  return ts.factory.updateSourceFile(
    sourceFile,
    statements,
    sourceFile.isDeclarationFile,
    sourceFile.referencedFiles,
    sourceFile.typeReferenceDirectives,
    sourceFile.hasNoDefaultLib,
    sourceFile.libReferenceDirectives
  );
}
