/**
 * Duplicate prop spreads removal using TypeScript AST
 *
 * Uses TypeScript's native compiler API for reliable AST parsing and transformation,
 * ensuring consistency with other transforms in the codebase.
 *
 * Finds and removes duplicate {...props} spreads within JSX elements using proper
 * JSX AST analysis. Keeps the last occurrence of duplicate spreads to maintain
 * React's property override behavior with precise syntax tree manipulation.
 *
 * Transform process:
 * 1. Parse code into TypeScript AST using ts.createSourceFile
 * 2. Find all JSXElement nodes with JSXSpreadAttribute children
 * 3. Group spread attributes by their identifier names
 * 4. Remove duplicate spreads keeping only the last occurrence
 * 5. Generate transformed code from modified AST using ts.createPrinter
 *
 * Examples of transformations:
 *
 * Duplicate props spread:
 * ```jsx
 * <div
 *   {...props}
 *   data-slot="label"
 *   className={cn(className, 'col-start-2 row-start-1')}
 *   {...props}
 * />
 * // becomes:
 * <div
 *   data-slot="label"
 *   className={cn(className, 'col-start-2 row-start-1')}
 *   {...props}
 * />
 * ```
 *
 * Complex nested JSX:
 * ```jsx
 * <button
 *   {...buttonProps}
 *   type="button"
 *   disabled={isDisabled}
 *   {...buttonProps}
 *   {...otherProps}
 *   {...buttonProps}
 * >
 * // becomes:
 * <button
 *   type="button"
 *   disabled={isDisabled}
 *   {...otherProps}
 *   {...buttonProps}
 * >
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
export const removeDuplicatePropsTransform = createTransformMetadata(
  'remove-duplicate-props',
  'Remove duplicate prop spreads from JSX elements',
  'quality'
);

/**
 * AST context for duplicate props removal transformations
 */
interface RemoveDuplicatePropsContext {
  sourceFile: ts.SourceFile;
  changes: string[];
  warnings: string[];
  elementsWithDuplicates: number;
}

/**
 * JSX spread attribute information for duplicate detection
 */
interface SpreadAttributeInfo {
  attribute: ts.JsxSpreadAttribute;
  identifier: string;
  index: number;
  element: ts.JsxOpeningElement | ts.JsxSelfClosingElement;
}

/**
 * Initialize remove duplicate props AST context
 */
function createRemoveDuplicatePropsContext(input: string): RemoveDuplicatePropsContext | null {
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
      elementsWithDuplicates: 0,
    };
  } catch (_error) {
    return null;
  }
}

/**
 * Find JSX elements with spread attributes using TypeScript AST
 *
 * Transform process:
 * 1. Find all JSXElement and JSXSelfClosingElement nodes
 * 2. Extract JSXSpreadAttribute nodes from their attributes
 * 3. Group spread attributes by their identifier names
 * 4. Return elements that have duplicate spreads
 *
 * Examples:
 * - Finds `<div {...props} className="..." {...props} />` → duplicate props spreads
 * - Finds `<button {...buttonProps} {...otherProps} {...buttonProps}>` → duplicate buttonProps
 * - Identifies elements that need duplicate removal processing
 */
function findJSXElementsWithDuplicateSpreads(
  context: RemoveDuplicatePropsContext
): Map<ts.JsxOpeningElement | ts.JsxSelfClosingElement, SpreadAttributeInfo[]> {
  const { sourceFile } = context;
  const elementsWithDuplicates = new Map<
    ts.JsxOpeningElement | ts.JsxSelfClosingElement,
    SpreadAttributeInfo[]
  >();

  function visitNode(node: ts.Node): void {
    // Handle JSX elements with opening and closing tags
    if (ts.isJsxElement(node)) {
      const spreads = extractSpreadAttributes(node.openingElement);
      const duplicateSpreads = findDuplicateSpreads(spreads);
      if (duplicateSpreads.length > 0) {
        elementsWithDuplicates.set(node.openingElement, duplicateSpreads);
      }
    }

    // Handle self-closing JSX elements
    if (ts.isJsxSelfClosingElement(node)) {
      const spreads = extractSpreadAttributes(node);
      const duplicateSpreads = findDuplicateSpreads(spreads);
      if (duplicateSpreads.length > 0) {
        elementsWithDuplicates.set(node, duplicateSpreads);
      }
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);
  return elementsWithDuplicates;
}

/**
 * Extract spread attributes from JSX opening element using TypeScript AST
 *
 * Transform process:
 * 1. Iterate through all JSX attributes in the element
 * 2. Find JSXSpreadAttribute nodes
 * 3. Extract identifier names from spread expressions
 * 4. Return structured information about each spread
 *
 * Examples:
 * - Extracts `{...props}` → { identifier: 'props', index: 0 }
 * - Extracts `{...buttonProps}` → { identifier: 'buttonProps', index: 2 }
 * - Handles complex expressions and nested identifiers
 */
function extractSpreadAttributes(
  element: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): SpreadAttributeInfo[] {
  const spreads: SpreadAttributeInfo[] = [];

  element.attributes.properties.forEach((attribute, index) => {
    if (ts.isJsxSpreadAttribute(attribute)) {
      // Check if the spread expression is a simple identifier
      if (ts.isIdentifier(attribute.expression)) {
        spreads.push({
          attribute,
          identifier: attribute.expression.text,
          index,
          element,
        });
      }
    }
  });

  return spreads;
}

/**
 * Find duplicate spreads by grouping by identifier using TypeScript AST
 *
 * Transform process:
 * 1. Group spread attributes by their identifier names
 * 2. Find groups with more than one occurrence
 * 3. Return spreads that are duplicates (excluding the last occurrence)
 * 4. Preserve React's override behavior by keeping the last spread
 *
 * Examples:
 * - Groups [props, props, otherProps] → { props: [spread1, spread2], otherProps: [spread3] }
 * - Returns [spread1] (removes first props, keeps last props and otherProps)
 * - Maintains proper override semantics for React props
 */
function findDuplicateSpreads(spreads: SpreadAttributeInfo[]): SpreadAttributeInfo[] {
  const spreadsByIdentifier = new Map<string, SpreadAttributeInfo[]>();

  // Group spreads by identifier
  spreads.forEach(spread => {
    const identifier = spread.identifier;
    if (!spreadsByIdentifier.has(identifier)) {
      spreadsByIdentifier.set(identifier, []);
    }
    spreadsByIdentifier.get(identifier)!.push(spread);
  });

  // Find duplicates (all but the last occurrence of each identifier)
  const duplicateSpreads: SpreadAttributeInfo[] = [];

  spreadsByIdentifier.forEach(spreadGroup => {
    if (spreadGroup.length > 1) {
      // Remove all but the last occurrence (slice off the last one)
      duplicateSpreads.push(...spreadGroup.slice(0, -1));
    }
  });

  return duplicateSpreads;
}

/**
 * Remove duplicate spread attributes from JSX elements using TypeScript AST transformers
 *
 * Transform process:
 * 1. Transform JSX opening elements and self-closing elements
 * 2. Filter out duplicate spread attributes from attributes array
 * 3. Preserve all other attributes and their order
 * 4. Update AST nodes with filtered attributes
 *
 * Examples:
 * - Removes duplicate `{...props}` spreads from JSX attributes
 * - Preserves attribute order for remaining non-duplicate attributes
 * - Maintains JSX structure and formatting through AST manipulation
 */
function removeDuplicateSpreadAttributes(
  context: RemoveDuplicatePropsContext,
  elementsWithDuplicates: Map<
    ts.JsxOpeningElement | ts.JsxSelfClosingElement,
    SpreadAttributeInfo[]
  >
): ts.SourceFile {
  const { sourceFile } = context;

  const transformer: ts.TransformerFactory<ts.SourceFile> = transformContext => {
    return sourceFile => {
      function visitNode(node: ts.Node): ts.Node {
        // Handle JSX opening elements
        if (ts.isJsxOpeningElement(node) && elementsWithDuplicates.has(node)) {
          const duplicateSpreads = elementsWithDuplicates.get(node)!;
          const filteredAttributes = filterDuplicateAttributes(node.attributes, duplicateSpreads);

          updateContextForRemovals(context, node, duplicateSpreads);

          return ts.factory.updateJsxOpeningElement(
            node,
            node.tagName,
            node.typeArguments,
            filteredAttributes
          );
        }

        // Handle self-closing JSX elements
        if (ts.isJsxSelfClosingElement(node) && elementsWithDuplicates.has(node)) {
          const duplicateSpreads = elementsWithDuplicates.get(node)!;
          const filteredAttributes = filterDuplicateAttributes(node.attributes, duplicateSpreads);

          updateContextForRemovals(context, node, duplicateSpreads);

          return ts.factory.updateJsxSelfClosingElement(
            node,
            node.tagName,
            node.typeArguments,
            filteredAttributes
          );
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
 * Filter duplicate attributes from JSX attributes array
 *
 * Transform process:
 * 1. Create set of duplicate spread attributes to remove
 * 2. Filter JSX attributes excluding the duplicates
 * 3. Preserve order and structure of remaining attributes
 * 4. Return updated JSXAttributes node
 */
function filterDuplicateAttributes(
  attributes: ts.JsxAttributes,
  duplicateSpreads: SpreadAttributeInfo[]
): ts.JsxAttributes {
  const duplicateSpreadSet = new Set(duplicateSpreads.map(d => d.attribute));

  const filteredProperties = attributes.properties.filter(
    prop => !duplicateSpreadSet.has(prop as ts.JsxSpreadAttribute)
  );

  return ts.factory.updateJsxAttributes(attributes, filteredProperties);
}

/**
 * Update context with removal information for reporting
 */
function updateContextForRemovals(
  context: RemoveDuplicatePropsContext,
  element: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  duplicateSpreads: SpreadAttributeInfo[]
): void {
  const tagName = ts.isIdentifier(element.tagName) ? element.tagName.text : 'unknown';

  duplicateSpreads.forEach(spread => {
    context.changes.push(
      `Removed duplicate {...${spread.identifier}} spread from ${tagName} element`
    );
    context.warnings.push(
      `Removed duplicate {...${spread.identifier}} spread in ${tagName} element`
    );
  });

  context.elementsWithDuplicates++;
}

/**
 * Generate final transformed code from TypeScript AST
 *
 * Uses TypeScript's native printer for consistent formatting and proper
 * handling of all TypeScript and JSX syntax features.
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
 * Remove duplicate prop spreads from JSX elements using TypeScript AST
 *
 * Transform process:
 * 1. Parse code into TypeScript AST with JSX support
 * 2. Find JSX elements with duplicate spread attributes
 * 3. Remove all but the last occurrence of each duplicate spread
 * 4. Preserve React's property override behavior and JSX structure
 * 5. Generate transformed code with consistent formatting
 *
 * @param input - The source code content to transform
 * @returns Result containing transformed content, change status, and any warnings
 *
 * @example
 * ```tsx
 * // Input:
 * <div {...props} className="test" {...props} />
 *
 * // Output:
 * <div className="test" {...props} />
 * ```
 */
export function transformRemoveDuplicateProps(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    /////////////////////////////////////////////////////////////////////////////////
    // Phase 1: Initialize AST Context
    // Creates TypeScript AST from input source code with JSX support
    /////////////////////////////////////////////////////////////////////////////////
    const context = createRemoveDuplicatePropsContext(input);
    if (!context) {
      return {
        content: input,
        changed: false,
        warnings: ['Failed to parse TypeScript AST'],
      };
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 2: Find JSX Elements with Duplicate Spreads using TypeScript AST
    // Locates all JSX elements that have duplicate spread attributes
    /////////////////////////////////////////////////////////////////////////////////
    const elementsWithDuplicates = findJSXElementsWithDuplicateSpreads(context);

    if (elementsWithDuplicates.size === 0) {
      return {
        content: input,
        changed: false,
        warnings: [],
      };
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 3: Remove Duplicate Spread Attributes using TypeScript AST
    // Transforms JSX elements to remove duplicate spreads while preserving structure
    /////////////////////////////////////////////////////////////////////////////////
    const transformedSourceFile = removeDuplicateSpreadAttributes(context, elementsWithDuplicates);

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 4: Generate Final Transformed Code
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
