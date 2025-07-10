/**
 * Reference transformation for Catalyst prefix transformations using TypeScript AST
 *
 * Migrated from jscodeshift to TypeScript's native compiler API for better performance,
 * reliability, and consistency with other transforms in the codebase.
 *
 * Handles transformation of all component and type references throughout the code,
 * including function parameters, JSX elements, type references, and variable declarations.
 * Protects Headless UI qualified names from any modifications.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Update function parameter types in component definitions
 * 3. Update typeof expressions in type definitions
 * 4. Update JSX expressions and elements
 * 5. Update type references and annotations
 * 6. Update direct identifier references with comprehensive exclusions
 * 7. Generate transformed code from modified AST using ts.createPrinter
 *
 * Examples of transformations:
 *
 * Function parameter types:
 * ```tsx
 * function CatalystButton({ color }: ButtonProps) { }
 * // becomes:
 * function CatalystButton({ color }: CatalystButtonProps) { }
 * ```
 *
 * Typeof expressions:
 * ```tsx
 * ComponentPropsWithoutRef<typeof Button>
 * // becomes:
 * ComponentPropsWithoutRef<typeof CatalystButton>
 * ```
 *
 * JSX elements:
 * ```tsx
 * <Button color="blue">Click me</Button>
 * // becomes:
 * <CatalystButton color="blue">Click me</CatalystButton>
 * ```
 *
 * Type references:
 * ```tsx
 * React.ComponentProps<Button>
 * // becomes:
 * React.ComponentProps<CatalystButton>
 * ```
 *
 * Headless UI protection:
 * ```tsx
 * import * as Headless from '@headlessui/react';
 * // Headless.Button references remain unchanged
 * ```
 *
 * Uses TypeScript's compiler API for reliable AST parsing and transformation.
 * Pure functional interface with no classes.
 */

import type { TSASTContext } from './core.js';
import ts from 'typescript';

/**
 * Update function parameter types in component definitions using TypeScript AST
 *
 * Transform process:
 * 1. Find all VariableDeclaration nodes with Catalyst-prefixed names
 * 2. Locate function expressions and arrow functions in declarations
 * 3. Extract first parameter type annotations
 * 4. Update generic Props types to component-specific types
 * 5. Protect Headless UI types from transformation
 *
 * Examples:
 * - Updates `forwardRef(function Button({ color }: ButtonProps)` parameter types
 * - Transforms `CatalystButton = ({ style }: ButtonProps)` to use `CatalystButtonProps`
 * - Preserves Headless UI prop types from any modifications
 */
export function updateTSFunctionParameterTypes(context: TSASTContext): ts.SourceFile {
  const { sourceFile, oldToNewMap, headlessPropsTypes, changes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 1: Function Parameter Type Updates with TypeScript AST
  // Find variable declarations with Catalyst functions and update their parameter types
  /////////////////////////////////////////////////////////////////////////////////
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process variable declarations with Catalyst-prefixed names
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
          const varName = node.name.text;

          if (varName.startsWith('Catalyst') && node.initializer) {
            let funcNode: ts.ArrowFunction | ts.FunctionExpression | undefined;

            // Handle arrow functions: const CatalystButton = ({ color }: ButtonProps) => ...
            if (ts.isArrowFunction(node.initializer)) {
              funcNode = node.initializer;
            }
            // Handle forwardRef calls: const CatalystButton = forwardRef(function(...){})
            else if (
              ts.isCallExpression(node.initializer) &&
              ts.isIdentifier(node.initializer.expression) &&
              node.initializer.expression.text === 'forwardRef' &&
              node.initializer.arguments.length > 0
            ) {
              const firstArg = node.initializer.arguments[0];
              if (ts.isArrowFunction(firstArg) || ts.isFunctionExpression(firstArg)) {
                funcNode = firstArg;
              }
            }

            if (funcNode && funcNode.parameters.length > 0) {
              const firstParam = funcNode.parameters[0];

              // Handle object pattern parameters: { color, size }: ButtonProps
              if (ts.isParameter(firstParam) && firstParam.type) {
                if (
                  ts.isTypeReferenceNode(firstParam.type) &&
                  ts.isIdentifier(firstParam.type.typeName)
                ) {
                  const currentTypeName = firstParam.type.typeName.text;
                  const baseName = varName.replace('Catalyst', '');
                  const expectedTypeName = `Catalyst${baseName}Props`;

                  // Check if we should transform this type
                  const shouldTransform =
                    (currentTypeName === 'ButtonProps' ||
                      currentTypeName === 'ComboboxProps' ||
                      currentTypeName === 'DropdownProps' ||
                      currentTypeName === 'ListboxProps' ||
                      (currentTypeName === `${baseName}Props` &&
                        !currentTypeName.startsWith('Catalyst')) ||
                      (currentTypeName.endsWith('Props') &&
                        !currentTypeName.startsWith('Catalyst'))) &&
                    !headlessPropsTypes.has(currentTypeName);

                  if (shouldTransform) {
                    changes.push(
                      `Updated function parameter type from ${currentTypeName} to ${expectedTypeName} in ${varName}`
                    );

                    // Add to mapping if not a Headless type
                    if (!headlessPropsTypes.has(currentTypeName)) {
                      oldToNewMap.set(currentTypeName, expectedTypeName);
                    }

                    // Update the type reference
                    const updatedType = ts.factory.updateTypeReferenceNode(
                      firstParam.type,
                      ts.factory.createIdentifier(expectedTypeName),
                      firstParam.type.typeArguments
                    );

                    const updatedParam = ts.factory.updateParameterDeclaration(
                      firstParam,
                      firstParam.modifiers,
                      firstParam.dotDotDotToken,
                      firstParam.name,
                      firstParam.questionToken,
                      updatedType,
                      firstParam.initializer
                    );

                    if (ts.isArrowFunction(funcNode)) {
                      const updatedFunc = ts.factory.updateArrowFunction(
                        funcNode,
                        funcNode.modifiers,
                        funcNode.typeParameters,
                        [updatedParam, ...funcNode.parameters.slice(1)],
                        funcNode.type,
                        funcNode.equalsGreaterThanToken,
                        funcNode.body
                      );

                      return ts.factory.updateVariableDeclaration(
                        node,
                        node.name,
                        node.exclamationToken,
                        node.type,
                        updatedFunc
                      );
                    } else if (ts.isFunctionExpression(funcNode)) {
                      const updatedFunc = ts.factory.updateFunctionExpression(
                        funcNode,
                        funcNode.modifiers,
                        funcNode.asteriskToken,
                        funcNode.name,
                        funcNode.typeParameters,
                        [updatedParam, ...funcNode.parameters.slice(1)],
                        funcNode.type,
                        funcNode.body
                      );

                      if (ts.isCallExpression(node.initializer)) {
                        const updatedCall = ts.factory.updateCallExpression(
                          node.initializer,
                          node.initializer.expression,
                          node.initializer.typeArguments,
                          [updatedFunc, ...node.initializer.arguments.slice(1)]
                        );

                        return ts.factory.updateVariableDeclaration(
                          node,
                          node.name,
                          node.exclamationToken,
                          node.type,
                          updatedCall
                        );
                      }
                    }
                  }
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

  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];
  result.dispose();

  return transformedSourceFile;
}

/**
 * Update typeof expressions in type definitions using TypeScript AST
 *
 * Transform process:
 * 1. Find all TypeQueryNode nodes (typeof expressions)
 * 2. Extract expression names from typeof references
 * 3. Apply name mappings from oldToNewMap
 * 4. Update typeof references to use new component names
 *
 * Examples:
 * - Transforms `typeof Button` to `typeof CatalystButton`
 * - Updates `ComponentPropsWithoutRef<typeof Input>` references
 * - Handles complex typeof expressions in utility types
 */
export function updateTSTypeofUsages(context: TSASTContext): ts.SourceFile {
  const { sourceFile, oldToNewMap, changes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 2: Typeof Expression Updates with TypeScript AST
  // Find all typeof expressions and update their referenced names
  /////////////////////////////////////////////////////////////////////////////////
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process typeof expressions
        if (ts.isTypeQueryNode(node) && ts.isIdentifier(node.exprName)) {
          const oldName = node.exprName.text;
          const newName = oldToNewMap.get(oldName);

          if (newName) {
            changes.push(`Updated typeof reference from typeof ${oldName} to typeof ${newName}`);

            return ts.factory.updateTypeQueryNode(node, ts.factory.createIdentifier(newName));
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
 * Update JSX expressions and elements using TypeScript AST
 *
 * Transform process:
 * 1. Find all JsxExpression nodes for attribute values
 * 2. Find all JsxOpeningElement and JsxClosingElement nodes
 * 3. Extract component names from JSX tags and expressions
 * 4. Apply name mappings to update component references
 * 5. Update both opening and closing tags consistently
 *
 * Examples:
 * - Transforms `<Button color="blue">` to `<CatalystButton color="blue">`
 * - Updates `<Component as={Button} />` expressions
 * - Handles self-closing JSX elements properly
 */
export function updateTSJSXReferences(context: TSASTContext): ts.SourceFile {
  const { sourceFile, oldToNewMap, changes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 3: JSX Reference Updates with TypeScript AST
  // Find all JSX elements and expressions and update component names
  /////////////////////////////////////////////////////////////////////////////////
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process JSX expressions in attributes: <Component as={Button} />
        if (ts.isJsxExpression(node) && node.expression && ts.isIdentifier(node.expression)) {
          const oldName = node.expression.text;
          const newName = oldToNewMap.get(oldName);

          if (newName) {
            changes.push(`Updated JSX expression from as={${oldName}} to as={${newName}}`);

            return ts.factory.updateJsxExpression(node, ts.factory.createIdentifier(newName));
          }
        }

        // Process JSX opening elements: <Button>
        if (ts.isJsxOpeningElement(node) && ts.isIdentifier(node.tagName)) {
          const oldName = node.tagName.text;
          const newName = oldToNewMap.get(oldName);

          if (newName) {
            changes.push(`Updated JSX opening element from <${oldName}> to <${newName}>`);

            return ts.factory.updateJsxOpeningElement(
              node,
              ts.factory.createIdentifier(newName),
              node.typeArguments,
              node.attributes
            );
          }
        }

        // Process JSX closing elements: </Button>
        if (ts.isJsxClosingElement(node) && ts.isIdentifier(node.tagName)) {
          const oldName = node.tagName.text;
          const newName = oldToNewMap.get(oldName);

          if (newName) {
            changes.push(`Updated JSX closing element from </${oldName}> to </${newName}>`);

            return ts.factory.updateJsxClosingElement(node, ts.factory.createIdentifier(newName));
          }
        }

        // Process JSX self-closing elements: <Button />
        if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName)) {
          const oldName = node.tagName.text;
          const newName = oldToNewMap.get(oldName);

          if (newName) {
            changes.push(`Updated JSX self-closing element from <${oldName} /> to <${newName} />`);

            return ts.factory.updateJsxSelfClosingElement(
              node,
              ts.factory.createIdentifier(newName),
              node.typeArguments,
              node.attributes
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
 * Update type references and annotations using TypeScript AST
 *
 * Transform process:
 * 1. Find all TypeReferenceNode nodes
 * 2. Handle both simple identifiers and qualified names
 * 3. Protect Headless namespace references from transformation
 * 4. Apply name mappings to update type references
 * 5. Handle complex generic type expressions
 *
 * Examples:
 * - Transforms `React.ComponentProps<Button>` to `React.ComponentProps<CatalystButton>`
 * - Updates `ButtonProps` type annotations to `CatalystButtonProps`
 * - Preserves `Headless.ButtonProps` references unchanged
 */
export function updateTSTypeReferences(context: TSASTContext): ts.SourceFile {
  const { sourceFile, oldToNewMap, changes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 4: Type Reference Updates with TypeScript AST
  // Find all type references and update their names, protecting Headless namespace
  /////////////////////////////////////////////////////////////////////////////////
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process type references
        if (ts.isTypeReferenceNode(node)) {
          // Handle simple identifiers: ButtonProps
          if (ts.isIdentifier(node.typeName)) {
            const oldName = node.typeName.text;
            const newName = oldToNewMap.get(oldName);

            if (newName) {
              changes.push(`Updated type reference from ${oldName} to ${newName}`);

              return ts.factory.updateTypeReferenceNode(
                node,
                ts.factory.createIdentifier(newName),
                node.typeArguments
              );
            }
          }
          // Handle qualified names: React.ComponentProps<Button>
          else if (ts.isQualifiedName(node.typeName)) {
            // NEVER transform Headless namespace references
            if (ts.isIdentifier(node.typeName.left) && node.typeName.left.text === 'Headless') {
              return node;
            }

            if (ts.isIdentifier(node.typeName.right)) {
              const oldName = node.typeName.right.text;
              const newName = oldToNewMap.get(oldName);

              if (newName) {
                const leftName = ts.isIdentifier(node.typeName.left)
                  ? node.typeName.left.text
                  : 'Unknown';
                changes.push(
                  `Updated qualified type reference from ${leftName}.${oldName} to ${leftName}.${newName}`
                );

                return ts.factory.updateTypeReferenceNode(
                  node,
                  ts.factory.updateQualifiedName(
                    node.typeName,
                    node.typeName.left,
                    ts.factory.createIdentifier(newName)
                  ),
                  node.typeArguments
                );
              }
            }
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
 * Update direct identifier references with comprehensive exclusions using TypeScript AST
 *
 * Transform process:
 * 1. Find all Identifier nodes throughout the AST
 * 2. Apply comprehensive exclusions to avoid transforming declarations
 * 3. Protect Headless namespace member expressions and qualified names
 * 4. Update variable assignments and function calls
 * 5. Skip import specifiers and type declarations
 *
 * Examples:
 * - Transforms `const MyButton = Button` to `const MyButton = CatalystButton`
 * - Updates `Button()` function calls to `CatalystButton()`
 * - Preserves `Headless.Button` member expressions
 * - Skips transforming import statements and type declarations
 */
export function updateTSDirectIdentifiers(context: TSASTContext): ts.SourceFile {
  const { sourceFile, oldToNewMap, changes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 5: Direct Identifier Updates with TypeScript AST
  // Find all identifiers and update them with comprehensive exclusions
  /////////////////////////////////////////////////////////////////////////////////
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process identifiers with exclusions
        if (ts.isIdentifier(node)) {
          const oldName = node.text;
          const newName = oldToNewMap.get(oldName);

          // Only process if this identifier is in our transformation mapping
          // and looks like a component name (starts with uppercase letter)
          if (newName && oldName.charAt(0) >= 'A' && oldName.charAt(0) <= 'Z') {
            const parent = node.parent;

            // Skip Headless namespace member expressions: Headless.Button
            if (parent && ts.isPropertyAccessExpression(parent)) {
              if (
                ts.isIdentifier(parent.expression) &&
                parent.expression.text === 'Headless' &&
                parent.name === node
              ) {
                return node;
              }
            }

            // Skip Headless qualified names: Headless.ButtonProps
            if (parent && ts.isQualifiedName(parent)) {
              if (
                ts.isIdentifier(parent.left) &&
                parent.left.text === 'Headless' &&
                parent.right === node
              ) {
                return node;
              }
            }

            // Apply comprehensive exclusions - don't transform in these contexts:
            const shouldExclude =
              parent &&
              // Import specifiers: import { Button } from '...'
              (ts.isImportSpecifier(parent) ||
                // Export specifiers: export { Button }
                ts.isExportSpecifier(parent) ||
                // JSX tag names (handled in JSX phase)
                ts.isJsxOpeningElement(parent) ||
                ts.isJsxClosingElement(parent) ||
                ts.isJsxSelfClosingElement(parent) ||
                // Type query expressions (handled in typeof phase)
                ts.isTypeQueryNode(parent) ||
                // Type references (handled in type reference phase)
                ts.isTypeReferenceNode(parent) ||
                // Type alias declarations: type ButtonProps = ...
                ts.isTypeAliasDeclaration(parent) ||
                // Function declarations: function Button() {}
                ts.isFunctionDeclaration(parent) ||
                // Variable declarators: const Button = ... (variable names on left side)
                (ts.isVariableDeclaration(parent) && parent.name === node) ||
                // Binding patterns in variable declarations: const { sizes } = obj
                (ts.isBindingElement(parent) && parent.name === node) ||
                // Property names in object literals: { sizes: '...' }
                (ts.isPropertyAssignment(parent) && parent.name === node) ||
                // Shorthand property assignments: { sizes }
                (ts.isShorthandPropertyAssignment(parent) && parent.name === node) ||
                // Property access expressions (left side): Button.something
                (ts.isPropertyAccessExpression(parent) && parent.expression === node));

            if (!shouldExclude) {
              changes.push(`Updated identifier reference from ${oldName} to ${newName}`);
              return ts.factory.createIdentifier(newName);
            }
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
