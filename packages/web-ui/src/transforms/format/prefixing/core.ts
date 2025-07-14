/**
 * Core AST utilities and mapping system for Catalyst prefix transformations using TypeScript AST
 *
 * Uses TypeScript's native compiler API for reliable AST parsing and transformation,
 * ensuring consistency with other transforms in the codebase.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Process export declarations and build component name mappings
 * 3. Detect and protect Headless UI references from transformation
 * 4. Map type aliases and ensure they follow Catalyst naming
 * 5. Transform all references throughout the AST
 * 6. Generate transformed code from modified AST using ts.createPrinter
 *
 * Examples of transformations:
 *
 * Export function prefixing:
 * ```tsx
 * export function Button() { return <button />; }
 * // becomes:
 * export function CatalystButton() { return <button />; }
 * ```
 *
 * Type alias prefixing:
 * ```tsx
 * type ButtonProps = { children: React.ReactNode; }
 * // becomes:
 * type CatalystButtonProps = { children: React.ReactNode; }
 * ```
 *
 * Reference updates:
 * ```tsx
 * const MyButton: ButtonProps = { children: 'Click me' };
 * // becomes:
 * const MyButton: CatalystButtonProps = { children: 'Click me' };
 * ```
 *
 * Headless UI protection:
 * ```tsx
 * import { Button as HeadlessButton } from '@headlessui/react';
 * // HeadlessButton references remain unchanged
 * ```
 *
 * Uses TypeScript's compiler API for reliable AST parsing and transformation.
 * Pure functional interface with no classes.
 */

import { ok, err, type Result, type CLIError } from '@esteban-url/cli/core';
import ts from 'typescript';

/**
 * AST context for TypeScript-based transformations
 */
export interface ASTContext {
  sourceFile: ts.SourceFile;
  oldToNewMap: Map<string, string>;
  headlessPropsTypes: Set<string>;
  changes: string[];
  warnings: string[];
}

/**
 * Initialize TypeScript AST context
 */
export function createASTContext(input: string): Result<ASTContext, CLIError> {
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
      oldToNewMap: new Map<string, string>(),
      headlessPropsTypes: new Set<string>(),
      changes: [],
      warnings: [],
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
 * Process export declarations and build initial function name mappings using TypeScript AST
 *
 * Transform process:
 * 1. Find all ExportDeclaration nodes in the AST
 * 2. Identify function declarations and variable declarations
 * 3. Extract function names and add Catalyst prefix if needed
 * 4. Build mapping from old names to new names
 * 5. Track changes for reporting
 *
 * Examples:
 * - Transforms `export function Button()` to `export function CatalystButton()`
 * - Transforms `export const Input = forwardRef(...)` to `export const CatalystInput = forwardRef(...)`
 * - Preserves existing Catalyst-prefixed exports
 */
/**
 * Helper function to check if a node is exported
 */
function hasExportModifier(node: ts.Node): boolean {
  // Check if the current node itself has export modifier
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isVariableStatement(node) ||
    ts.isTypeAliasDeclaration(node)
  ) {
    if (node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
      return true;
    }
  }

  // Check parent nodes for export context
  let current = node.parent;
  while (current) {
    if (ts.isExportDeclaration(current) || ts.isExportAssignment(current)) {
      return true;
    }
    if (ts.isVariableStatement(current) || ts.isFunctionDeclaration(current)) {
      return current.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword) ?? false;
    }
    current = current.parent;
  }
  return false;
}

export function processExportDeclarations(context: ASTContext): ts.SourceFile {
  const { sourceFile, changes, oldToNewMap } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 1: Export Declaration Processing with TypeScript AST
  //
  // From:  export function Button() { return <button />; }
  // To:    export function CatalystButton() { return <button />; }
  //
  /////////////////////////////////////////////////////////////////////////////////
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process export declarations
        if (
          ts.isExportDeclaration(node) &&
          node.exportClause &&
          ts.isNamedExports(node.exportClause)
        ) {
          // Handle: export { Button, Input }
          const updatedElements = node.exportClause.elements.map(element => {
            const originalName = element.name.text;
            if (!originalName.startsWith('Catalyst')) {
              const newName = `Catalyst${originalName}`;
              oldToNewMap.set(originalName, newName);
              changes.push(`Updated export name from ${originalName} to ${newName}`);

              return ts.factory.updateExportSpecifier(
                element,
                false,
                ts.factory.createIdentifier(newName),
                element.propertyName || ts.factory.createIdentifier(originalName)
              );
            }
            return element;
          });

          return ts.factory.updateExportDeclaration(
            node,
            node.modifiers,
            false,
            ts.factory.updateNamedExports(node.exportClause, updatedElements),
            node.moduleSpecifier,
            node.assertClause
          );
        }

        // Process function declarations in export statements
        if (ts.isFunctionDeclaration(node) && node.name) {
          const originalName = node.name.text;

          // Only process if this function is actually exported
          const isExported = hasExportModifier(node);

          if (!originalName.startsWith('Catalyst') && isExported) {
            const newName = `Catalyst${originalName}`;
            oldToNewMap.set(originalName, newName);
            changes.push(`Updated function name from ${originalName} to ${newName}`);

            return ts.factory.updateFunctionDeclaration(
              node,
              node.modifiers,
              node.asteriskToken,
              ts.factory.createIdentifier(newName),
              node.typeParameters,
              node.parameters,
              node.type,
              node.body
            );
          }
        }

        // Process variable declarations in export statements
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
          const originalName = node.name.text;

          // Only process if this variable is actually exported and looks like a component
          const isExported = hasExportModifier(node);
          const looksLikeComponent = originalName.charAt(0) >= 'A' && originalName.charAt(0) <= 'Z';

          if (!originalName.startsWith('Catalyst') && isExported && looksLikeComponent) {
            const newName = `Catalyst${originalName}`;
            oldToNewMap.set(originalName, newName);
            changes.push(`Updated variable name from ${originalName} to ${newName}`);

            return ts.factory.updateVariableDeclaration(
              node,
              ts.factory.createIdentifier(newName),
              node.exclamationToken,
              node.type,
              node.initializer
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
 * Detect and protect Headless UI references from transformation using TypeScript AST
 *
 * Transform process:
 * 1. Find all ImportDeclaration nodes for @headlessui/react
 * 2. Extract imported names from named imports
 * 3. Add them to protection set to prevent transformation
 * 4. Handle namespace imports (import * as Headless)
 *
 * Examples:
 * - Protects `Button` from `import { Button } from '@headlessui/react'`
 * - Protects `ButtonProps` from `import { ButtonProps } from '@headlessui/react'`
 * - Handles namespace imports like `import * as Headless from '@headlessui/react'`
 */
export function detectHeadlessReferences(context: ASTContext): void {
  const { sourceFile, headlessPropsTypes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 2: Headless UI Protection with TypeScript AST
  // Finds:
  //        import { Button, Menu, Dialog } from '@headlessui/react'
  //        import * as Headless from '@headlessui/react'
  //        adds imported names to protected set to prevent prefixing
  //
  /////////////////////////////////////////////////////////////////////////////////
  function visitNode(node: ts.Node): void {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const moduleSpecifier = node.moduleSpecifier.text;

      if (moduleSpecifier === '@headlessui/react' && node.importClause) {
        // Handle named imports: import { Button, ButtonProps } from '@headlessui/react'
        if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach(element => {
            const importedName = element.name.text;
            headlessPropsTypes.add(importedName);
          });
        }

        // Handle namespace imports: import * as Headless from '@headlessui/react'
        if (
          node.importClause.namedBindings &&
          ts.isNamespaceImport(node.importClause.namedBindings)
        ) {
          // Namespace imports are protected by qualified name logic in reference transformation
          // No individual type names need to be added to protection set
        }
      }
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);
}

/**
 * Map type aliases and ensure they follow Catalyst naming using TypeScript AST
 *
 * Transform process:
 * 1. Find all TypeAliasDeclaration nodes
 * 2. Extract type names and check if they need Catalyst prefix
 * 3. Build comprehensive mapping including Props suffixes
 * 4. Protect Headless UI types from transformation
 *
 * Examples:
 * - Maps `ButtonProps` to `CatalystButtonProps`
 * - Maps `InputState` to `CatalystInputState`
 * - Generates automatic Props mappings for discovered components
 */
export function mapTypeAliases(context: ASTContext): ts.SourceFile {
  const { sourceFile, oldToNewMap, headlessPropsTypes } = context;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 3: Type Alias Mapping with TypeScript AST
  //
  // From:  type ButtonProps = { children: React.ReactNode }
  // To:    type CatalystButtonProps = { children: React.ReactNode }
  //
  /////////////////////////////////////////////////////////////////////////////////
  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Process type alias declarations
        if (ts.isTypeAliasDeclaration(node)) {
          const typeName = node.name.text;

          // Only process Props types, not all types
          if (
            !typeName.startsWith('Catalyst') &&
            !headlessPropsTypes.has(typeName) &&
            typeName.endsWith('Props')
          ) {
            const newTypeName = `Catalyst${typeName}`;
            oldToNewMap.set(typeName, newTypeName);

            // Ensure the type alias is exported by adding export modifier if not present
            const hasExport = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
            const modifiers = hasExport
              ? node.modifiers
              : [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ...(node.modifiers || [])];

            return ts.factory.updateTypeAliasDeclaration(
              node,
              modifiers,
              ts.factory.createIdentifier(newTypeName),
              node.typeParameters,
              node.type
            );
          } else if (typeName.startsWith('Catalyst')) {
            // Map existing Catalyst types
            const baseName = typeName.replace('Catalyst', '');
            if (baseName && !oldToNewMap.has(baseName) && !headlessPropsTypes.has(baseName)) {
              oldToNewMap.set(baseName, typeName);
            }
          }
        }

        return ts.visitEachChild(node, visitNode, transformContext);
      }

      return ts.visitNode(sourceFile, visitNode) as ts.SourceFile;
    };
  };

  // First pass: build mappings
  function buildMappings(node: ts.Node): void {
    if (ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.text;

      // Only process Props types, not all types
      if (
        !typeName.startsWith('Catalyst') &&
        !headlessPropsTypes.has(typeName) &&
        typeName.endsWith('Props')
      ) {
        oldToNewMap.set(typeName, `Catalyst${typeName}`);
      } else if (typeName.startsWith('Catalyst') && typeName.endsWith('Props')) {
        const baseName = typeName.replace('Catalyst', '');
        if (baseName && !oldToNewMap.has(baseName) && !headlessPropsTypes.has(baseName)) {
          oldToNewMap.set(baseName, typeName);
        }
      }
    }

    ts.forEachChild(node, buildMappings);
  }

  buildMappings(sourceFile);

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 4: Props Suffix Handling
  //
  // From:  CatalystButton (discovered component)
  // To:    ButtonProps -> CatalystButtonProps (auto-generated mapping)
  //
  /////////////////////////////////////////////////////////////////////////////////
  const catalystFunctions = Array.from(oldToNewMap.values()).filter(name =>
    name.startsWith('Catalyst')
  );

  catalystFunctions.forEach(catalystName => {
    const baseName = catalystName.replace('Catalyst', '');
    if (baseName) {
      const basePropsName = `${baseName}Props`;
      const catalystPropsName = `Catalyst${baseName}Props`;
      if (!oldToNewMap.has(basePropsName) && !headlessPropsTypes.has(basePropsName)) {
        oldToNewMap.set(basePropsName, catalystPropsName);
      }
    }
  });

  // Second pass: apply transformations
  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];
  result.dispose();

  return transformedSourceFile;
}

/**
 * Generate final transformed code from TypeScript AST
 *
 * Uses TypeScript's native printer for consistent formatting and proper
 * handling of all TypeScript syntax features.
 */
export function generateTransformedCode(sourceFile: ts.SourceFile): string {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  return printer.printFile(sourceFile);
}
