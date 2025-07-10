/**
 * Functional transform to remove duplicate prop spreads from JSX elements
 *
 * Uses TypeScript AST parsing to find and remove duplicate {...props} spreads
 * within JSX elements. Keeps the last occurrence of duplicate spreads to
 * maintain React's property override behavior.
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
 * Uses CLI framework Result types for consistent error handling.
 * Pure functional interface with no classes.
 */

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
 * Remove duplicate prop spreads from JSX elements
 *
 * Transform process:
 * 1. Find JSX elements with multiple {...props} spreads
 * 2. Remove all but the last occurrence of each duplicate spread
 * 3. Preserve whitespace and formatting around the remaining spread
 *
 * Examples:
 * - Removes `{...props}` when it appears multiple times in same JSX element
 * - Keeps the last occurrence to maintain React's override behavior
 * - Preserves all other attributes and formatting
 */
export function transformRemoveDuplicateProps(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    let content = input;
    const warnings: string[] = [];
    let changed = false;

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 1: Find JSX elements with duplicate prop spreads
    // Use a simpler, more reliable approach that handles multiline JSX
    //
    /////////////////////////////////////////////////////////////////////////////////

    // Pattern to match JSX opening tags across multiple lines
    const jsxOpeningTagRegex = /<(\w+)([^>]*?)>/gms;

    content = content.replace(jsxOpeningTagRegex, (fullMatch, tagName, attributes) => {
      /////////////////////////////////////////////////////////////////////////////////
      // Phase 2: Find all prop spreads in this element
      //
      /////////////////////////////////////////////////////////////////////////////////
      const spreadMatches: Array<{
        match: string;
        identifier: string;
        start: number;
        end: number;
      }> = [];
      const spreadRegex = /\{\s*\.\.\.(\w+)\s*\}/g;
      let spreadMatch;

      while ((spreadMatch = spreadRegex.exec(attributes)) !== null) {
        spreadMatches.push({
          match: spreadMatch[0],
          identifier: spreadMatch[1],
          start: spreadMatch.index,
          end: spreadMatch.index + spreadMatch[0].length,
        });
      }

      if (spreadMatches.length === 0) {
        return fullMatch; // No spreads found
      }

      /////////////////////////////////////////////////////////////////////////////////
      // Phase 3: Group by identifier and find duplicates
      //
      /////////////////////////////////////////////////////////////////////////////////
      const spreadsByIdentifier: Record<string, typeof spreadMatches> = {};

      for (const spread of spreadMatches) {
        if (!spreadsByIdentifier[spread.identifier]) {
          spreadsByIdentifier[spread.identifier] = [];
        }
        spreadsByIdentifier[spread.identifier].push(spread);
      }

      // Check if we have any duplicates
      const hasDuplicates = Object.values(spreadsByIdentifier).some(group => group.length > 1);

      if (!hasDuplicates) {
        return fullMatch; // No duplicates found
      }

      /////////////////////////////////////////////////////////////////////////////////
      // Phase 4: Remove duplicate spreads (keep only the last occurrence)
      //
      /////////////////////////////////////////////////////////////////////////////////
      let modifiedAttributes = attributes;
      const spreadsToRemove: Array<{ start: number; end: number; identifier: string }> = [];

      for (const [identifier, spreads] of Object.entries(spreadsByIdentifier)) {
        if (spreads.length > 1) {
          // Remove all but the last occurrence
          const toRemove = spreads.slice(0, -1);
          spreadsToRemove.push(...toRemove.map(s => ({ ...s, identifier })));
        }
      }

      // Sort by start position in descending order to avoid index shifting
      spreadsToRemove.sort((a, b) => b.start - a.start);

      for (const spreadToRemove of spreadsToRemove) {
        // Remove the spread and surrounding whitespace
        const beforeSpread = modifiedAttributes.substring(0, spreadToRemove.start);
        const afterSpread = modifiedAttributes.substring(spreadToRemove.end);

        // Find leading whitespace (newlines and spaces before the spread)
        const leadingWhitespaceMatch = beforeSpread.match(/\s*$/);
        const leadingWhitespace = leadingWhitespaceMatch ? leadingWhitespaceMatch[0] : '';

        // Find trailing whitespace (spaces/newlines after the spread)
        const trailingWhitespaceMatch = afterSpread.match(/^\s*/);
        const trailingWhitespace = trailingWhitespaceMatch ? trailingWhitespaceMatch[0] : '';

        // Remove spread with its whitespace, but preserve one newline if there was one
        const preserveNewline =
          leadingWhitespace.includes('\n') || trailingWhitespace.includes('\n');
        const replacement = preserveNewline && !afterSpread.startsWith('\n') ? '\n' : '';

        modifiedAttributes =
          beforeSpread.substring(0, beforeSpread.length - leadingWhitespace.length) +
          replacement +
          afterSpread.substring(trailingWhitespace.length);

        changed = true;
        warnings.push(
          `Removed duplicate {...${spreadToRemove.identifier}} spread in ${tagName} element`
        );
      }

      // Ensure proper spacing - if we have attributes, there should be a space after tag name
      if (modifiedAttributes.trim()) {
        // If the modified attributes don't start with whitespace, add a space
        const needsSpace = !modifiedAttributes.match(/^\s/);
        const finalAttributes = needsSpace ? ' ' + modifiedAttributes : modifiedAttributes;
        return `<${tagName}${finalAttributes}>`;
      } else {
        return `<${tagName}>`;
      }
    });

    return { content, changed, warnings };
  });
}
