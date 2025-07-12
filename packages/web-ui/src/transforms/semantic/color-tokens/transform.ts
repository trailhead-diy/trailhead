/**
 * Semantic colors transformation using TypeScript AST
 *
 * Uses TypeScript's native compiler API for reliable AST parsing and transformation,
 * ensuring consistency with other transforms in the codebase.
 *
 * Transforms hardcoded color values to semantic color tokens for consistent theming.
 * Processes both standalone colors objects and embedded colors within configuration objects.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Detect component type from export function declarations
 * 3. Find colors object literal expressions in AST
 * 4. Check for existing semantic colors
 * 5. Inject semantic colors into colors objects
 * 6. Generate transformed code from modified AST using ts.createPrinter
 *
 * Examples of transformations:
 *
 * Direct colors object:
 * ```tsx
 * const colors = { zinc: '#27272a', blue: '#3b82f6' };
 * // becomes:
 * const colors = { zinc: '#27272a', blue: '#3b82f6', primary: 'var(--color-zinc-900)' };
 * ```
 *
 * Nested colors object:
 * ```tsx
 * const styles = { colors: { zinc: ['#fafafa', '#27272a'] } };
 * // becomes:
 * const styles = { colors: { zinc: ['#fafafa', '#27272a'], primary: ['var(--color-zinc-50)', 'var(--color-zinc-900)'] } };
 * ```
 *
 * Uses TypeScript's compiler API for reliable AST parsing and transformation.
 * Pure functional interface with no classes.
 */

import ts from 'typescript';
import { getSemanticColorsForComponent } from './mappings.js';

/**
 * AST context for semantic colors transformations
 */
interface SemanticColorContext {
  sourceFile: ts.SourceFile;
  componentType: string;
  semanticColors: string[];
  semanticColorKeys: string[];
  changes: string[];
  warnings: string[];
}

/**
 * Colors object detection result
 */
interface ColorsObjectInfo {
  node: ts.ObjectLiteralExpression;
  pattern: 'direct' | 'nested' | 'styles';
  parentNode: ts.Node;
  hasExistingSemanticColors: boolean;
}

/**
 * Initialize semantic colors AST context
 */
function createSemanticColorContext(input: string): SemanticColorContext | null {
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
      componentType: '',
      semanticColors: [],
      semanticColorKeys: ['primary', 'secondary', 'destructive', 'accent', 'muted'],
      changes: [],
      warnings: [],
    };
  } catch {
    return null;
  }
}

/**
 * Detect component type from export function declarations using TypeScript AST
 *
 * Transform process:
 * 1. Find all ExportDeclaration and FunctionDeclaration nodes
 * 2. Extract exported function names that start with 'Catalyst'
 * 3. Return the detected component type for semantic color mapping
 *
 * Examples:
 * - Detects `export function CatalystButton()` → 'CatalystButton'
 * - Detects `export const CatalystBadge = forwardRef(...)` → 'CatalystBadge'
 */
function detectComponentType(context: SemanticColorContext): void {
  const { sourceFile } = context;

  function visitNode(node: ts.Node): void {
    // Check for exported function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const functionName = node.name.text;
      const isExported = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);

      if (isExported && functionName.startsWith('Catalyst')) {
        context.componentType = functionName;
        return;
      }
    }

    // Check for exported variable declarations (const CatalystButton = ...)
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);

      if (isExported && node.declarationList.declarations.length > 0) {
        const declaration = node.declarationList.declarations[0];
        if (ts.isIdentifier(declaration.name) && declaration.name.text.startsWith('Catalyst')) {
          context.componentType = declaration.name.text;
          return;
        }
      }
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);
}

/**
 * Find colors object literals in the AST using TypeScript AST
 *
 * Transform process:
 * 1. Find all VariableDeclaration nodes for `const colors = { ... }`
 * 2. Find all PropertyAssignment nodes for `colors: { ... }`
 * 3. Classify the pattern type (direct, nested, styles)
 * 4. Check for existing semantic colors in the object
 *
 * Examples:
 * - Finds `const colors = { zinc: '#27272a' }` → direct pattern
 * - Finds `colors: { zinc: ['#fafafa'] }` → nested pattern
 * - Finds `const styles = { colors: { ... } }` → styles pattern
 */
function findColorsObjects(context: SemanticColorContext): ColorsObjectInfo[] {
  const { sourceFile, semanticColorKeys } = context;
  const colorsObjects: ColorsObjectInfo[] = [];

  function hasSemanticColors(obj: ts.ObjectLiteralExpression): boolean {
    return obj.properties.some(prop => {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        return semanticColorKeys.includes(prop.name.text);
      }
      return false;
    });
  }

  function visitNode(node: ts.Node): void {
    // Pattern 1: const colors = { ... }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'colors' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      colorsObjects.push({
        node: node.initializer,
        pattern: 'direct',
        parentNode: node,
        hasExistingSemanticColors: hasSemanticColors(node.initializer),
      });
    }

    // Pattern 2: colors: { ... } (nested in objects)
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'colors' &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      // Check if this is inside a styles object
      const isInStyles = (() => {
        let parent: ts.Node | undefined = node.parent;
        while (parent) {
          if (ts.isVariableDeclaration(parent)) {
            const varDecl = parent as ts.VariableDeclaration;
            if (ts.isIdentifier(varDecl.name) && varDecl.name.text === 'styles') {
              return true;
            }
          }
          parent = parent.parent;
        }
        return false;
      })();

      colorsObjects.push({
        node: node.initializer,
        pattern: isInStyles ? 'styles' : 'nested',
        parentNode: node,
        hasExistingSemanticColors: hasSemanticColors(node.initializer),
      });
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);
  return colorsObjects;
}

/**
 * Create semantic color properties as AST nodes
 *
 * Transform process:
 * 1. Parse semantic color strings into proper AST nodes
 * 2. Handle both single values and multiline array values
 * 3. Create proper PropertyAssignment nodes
 *
 * Examples:
 * - Creates AST for `primary: 'bg-primary-500'`
 * - Creates AST for multiline arrays from mappings
 */
function createSemanticColorProperties(semanticColors: string[]): ts.PropertyAssignment[] {
  const properties: ts.PropertyAssignment[] = [];
  let i = 0;

  while (i < semanticColors.length) {
    const currentLine = semanticColors[i].trim();

    // Skip empty lines and closing brackets
    if (!currentLine || currentLine === '],') {
      i++;
      continue;
    }

    // Check if this line starts a semantic color property
    const colonIndex = currentLine.indexOf(':');
    if (colonIndex === -1) {
      i++;
      continue;
    }

    const key = currentLine.slice(0, colonIndex).trim();
    const valueStart = currentLine.slice(colonIndex + 1).trim();

    let value: ts.Expression;

    // Check if it's an array value (starts with '[')
    if (valueStart === '[') {
      // Collect array elements from subsequent lines until we find '],'
      const arrayElements: ts.StringLiteral[] = [];
      i++; // Move to next line after the opening bracket

      while (i < semanticColors.length) {
        const arrayLine = semanticColors[i].trim();

        if (arrayLine === '],' || arrayLine === '],') {
          break;
        }

        if (arrayLine && arrayLine !== '[' && arrayLine !== '],') {
          // Parse the array element - remove quotes and trailing comma
          let elementValue = arrayLine;
          if (elementValue.endsWith(',')) {
            elementValue = elementValue.slice(0, -1);
          }
          elementValue = elementValue.trim();

          // Remove surrounding quotes
          if (
            (elementValue.startsWith("'") && elementValue.endsWith("'")) ||
            (elementValue.startsWith('"') && elementValue.endsWith('"'))
          ) {
            elementValue = elementValue.slice(1, -1);
          }

          arrayElements.push(ts.factory.createStringLiteral(elementValue));
        }

        i++;
      }

      value = ts.factory.createArrayLiteralExpression(arrayElements);
    } else {
      // Single string value - remove trailing comma and quotes
      let stringValue = valueStart;
      if (stringValue.endsWith(',')) {
        stringValue = stringValue.slice(0, -1);
      }
      stringValue = stringValue.trim();

      // Remove surrounding quotes
      if (
        (stringValue.startsWith("'") && stringValue.endsWith("'")) ||
        (stringValue.startsWith('"') && stringValue.endsWith('"'))
      ) {
        stringValue = stringValue.slice(1, -1);
      }

      value = ts.factory.createStringLiteral(stringValue);
    }

    properties.push(ts.factory.createPropertyAssignment(ts.factory.createIdentifier(key), value));

    i++;
  }

  return properties;
}

/**
 * Process semantic colors injection using TypeScript AST transformers
 *
 * Transform process:
 * 1. Add semantic colors to colors objects that don't have them
 * 2. Update AST nodes while preserving structure and formatting
 *
 * Examples:
 * - Adds semantic color properties to existing colors objects
 * - Maintains proper indentation and structure
 */
function processSemanticColors(
  context: SemanticColorContext,
  colorsObjects: ColorsObjectInfo[]
): ts.SourceFile {
  const { sourceFile, semanticColors } = context;

  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Handle colors object transformations
        if (ts.isObjectLiteralExpression(node)) {
          const colorsObjectInfo = colorsObjects.find(info => info.node === node);

          if (colorsObjectInfo && !colorsObjectInfo.hasExistingSemanticColors) {
            // Add semantic colors to this colors object
            const semanticColorProps = createSemanticColorProperties(semanticColors);
            const newProperties = [...node.properties, ...semanticColorProps];

            context.changes.push(`Added ${semanticColors.length} semantic colors to colors object`);

            return ts.factory.updateObjectLiteralExpression(node, newProperties);
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
 * Core semantic colors transformation logic using TypeScript AST
 *
 * Transforms hardcoded color values to semantic color tokens for consistent theming.
 * Processes both standalone colors objects and embedded colors within configuration objects.
 *
 * @param input - The source code content to transform
 * @returns Object containing transformed content, change status, and any warnings
 *
 * @example
 * ```typescript
 * // Input:
 * const colors = { red: '#ef4444', blue: '#3b82f6' };
 * // Output:
 * const colors = { red: 'var(--color-red-500)', blue: 'var(--color-blue-500)', primary: 'var(--color-blue-600)' };
 * ```
 */
export function executeSemanticColorsTransform(input: string): {
  content: string;
  changed: boolean;
  warnings: string[];
} {
  /////////////////////////////////////////////////////////////////////////////////
  // Phase 1: Initialize AST Context
  // Creates TypeScript AST from input source code
  /////////////////////////////////////////////////////////////////////////////////
  const context = createSemanticColorContext(input);
  if (!context) {
    return {
      content: input,
      changed: false,
      warnings: ['Failed to parse TypeScript AST'],
    };
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 2: Component Type Detection using TypeScript AST
  // Finds exported component functions to determine semantic color mapping
  /////////////////////////////////////////////////////////////////////////////////
  detectComponentType(context);

  if (!context.componentType) {
    context.warnings.push('No Catalyst component export found');
    return { content: input, changed: false, warnings: context.warnings };
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 3: Generate Semantic Colors for Component Type
  // Uses mappings to get component-specific semantic color patterns
  /////////////////////////////////////////////////////////////////////////////////
  context.semanticColors = getSemanticColorsForComponent(input);

  if (context.semanticColors.length === 0) {
    context.warnings.push('Unknown component type, no semantic colors available');
    return { content: input, changed: false, warnings: context.warnings };
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 4: Find Colors Objects using TypeScript AST
  // Locates all colors object literals in the AST
  /////////////////////////////////////////////////////////////////////////////////
  const colorsObjects = findColorsObjects(context);

  if (colorsObjects.length === 0) {
    context.warnings.push('No colors object found in component');
    return { content: input, changed: false, warnings: context.warnings };
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 5: Check for Existing Semantic Colors
  // Determines if semantic colors already exist to avoid duplication
  /////////////////////////////////////////////////////////////////////////////////
  const hasExistingSemanticColors = colorsObjects.some(obj => obj.hasExistingSemanticColors);

  if (hasExistingSemanticColors) {
    context.warnings.push('Semantic colors already exist in colors object');
    return { content: input, changed: false, warnings: context.warnings };
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 6: Process Semantic Colors Injection using TypeScript AST
  // Applies transformations to inject semantic colors into colors objects
  /////////////////////////////////////////////////////////////////////////////////
  const transformedSourceFile = processSemanticColors(context, colorsObjects);

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 7: Generate Final Transformed Code
  // Uses TypeScript printer to generate formatted code from AST
  /////////////////////////////////////////////////////////////////////////////////
  const transformedContent = generateTransformedCode(transformedSourceFile);

  const changed = context.changes.length > 0 || transformedContent !== input;

  return {
    content: transformedContent,
    changed,
    warnings: context.warnings,
  };
}
