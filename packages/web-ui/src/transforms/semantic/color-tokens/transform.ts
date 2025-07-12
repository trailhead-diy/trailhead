/**
 * Core transformation logic for semantic colors transform
 *
 * Handles the main transformation phases including pattern detection,
 * semantic color injection, and content modification. Works with the
 * mappings module to apply component-specific color tokens.
 */

import { getSemanticColorsForComponent } from './mappings.js';

/**
 * Core semantic colors transformation logic
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
 * const colors = { red: 'var(--color-red-500)', blue: 'var(--color-blue-500)' };
 * ```
 */
export function executeSemanticColorsTransform(input: string): {
  content: string;
  changed: boolean;
  warnings: string[];
} {
  let content = input;
  const warnings: string[] = [];
  let changed = false;

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 1: Detect Colors Object Patterns
  // Finds:
  //        const colors = { zinc: '#27272a', blue: '#3b82f6' }
  //        colors: { zinc: ['#fafafa', '#27272a'], blue: ['#eff6ff', '#1e40af'] }
  //        const styles = { base: '...', colors: { zinc: '...', blue: '...' } }
  //
  /////////////////////////////////////////////////////////////////////////////////
  const directColorsObject = /const colors = \{/.test(content);
  const nestedColorsObject = /colors:\s*\{/.test(content);
  const stylesColorsObject = /const styles = \{[\s\S]*?colors:\s*\{/.test(content);

  if (!directColorsObject && !nestedColorsObject && !stylesColorsObject) {
    warnings.push('No colors object found in component');
    return { content, changed: false, warnings };
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 2: Component Type Detection and Semantic Color Generation
  // Finds:
  //        export function CatalystBadge pattern with 'inline-flex items-center'
  //        export function CatalystButton pattern with 'rounded-md px-2.5 py-1.5'
  //        then generates component-specific semantic colors (primary, secondary, etc.)
  //
  /////////////////////////////////////////////////////////////////////////////////
  const semanticColors = getSemanticColorsForComponent(content);

  if (semanticColors.length === 0) {
    warnings.push('Unknown component type, no semantic colors available');
    return { content, changed: false, warnings };
  }

  /////////////////////////////////////////////////////////////////////////////////
  // Phase 3: Check for Existing Semantic Colors and Misplaced Semantic Colors
  // Finds:
  //        existing 'primary', 'secondary', 'destructive', 'accent', 'muted' keys
  //        in colors object to avoid adding duplicates
  //        OR misplaced semantic colors that need to be moved into colors object
  //
  /////////////////////////////////////////////////////////////////////////////////
  const semanticColorKeys = ['primary', 'secondary', 'destructive', 'accent', 'muted'];

  // Check if semantic colors exist within the colors object (correct location)
  const hasSemanticColorsInColorsObject = (() => {
    if (directColorsObject) {
      const colorsMatch = content.match(/const colors = \{([\s\S]*?)\}/);
      if (colorsMatch) {
        return semanticColorKeys.some(key => colorsMatch[1].includes(`${key}:`));
      }
    }

    if (nestedColorsObject || stylesColorsObject) {
      const colorsMatch = content.match(/colors:\s*\{([\s\S]*?)\n\s*\}/);
      if (colorsMatch) {
        return semanticColorKeys.some(key => colorsMatch[1].includes(`${key}:`));
      }
    }

    return false;
  })();

  // Check if semantic colors exist outside colors object (incorrect location)
  const hasMisplacedSemanticColors = (() => {
    if (!stylesColorsObject) return false;

    // For styles pattern, check if semantic colors exist outside the colors object
    const stylesMatch = content.match(/const styles = \{([\s\S]*?)\};\s*\}?/);
    if (stylesMatch) {
      const stylesContent = stylesMatch[1];
      // More flexible pattern for colors object closing
      const colorsMatch = stylesContent.match(/colors:\s*\{[\s\S]*?\n\s*\}(?=\s*,|\s*$)/);

      if (colorsMatch) {
        // Get content after colors object within styles
        const afterColorsIndex = stylesContent.indexOf(colorsMatch[0]) + colorsMatch[0].length;
        const afterColorsContent = stylesContent.slice(afterColorsIndex);

        return semanticColorKeys.some(key => afterColorsContent.includes(`${key}:`));
      }
    }

    return false;
  })();

  // Phase 3A: Handle misplaced semantic colors (move them into colors object)
  if (hasMisplacedSemanticColors && !hasSemanticColorsInColorsObject) {
    /////////////////////////////////////////////////////////////////////////////////
    // Phase 3A: Move Misplaced Semantic Colors into Colors Object (Simple Approach)
    //
    // From:  const styles = { colors: { rose: [...] }, primary: [...], muted: [...] }
    // To:    const styles = { colors: { rose: [...], primary: [...], muted: [...] } }
    //
    /////////////////////////////////////////////////////////////////////////////////

    // Find and extract misplaced semantic colors
    const misplacedSemanticColors: Array<{ key: string; fullMatch: string; definition: string }> =
      [];
    semanticColorKeys.forEach(key => {
      // Look for semantic colors that appear after the colors object closes
      const colorsObjectEnd = content.lastIndexOf('  },');
      const afterColors = content.slice(colorsObjectEnd);

      const semanticPattern = new RegExp(`(\n\\s*)(${key}:\\s*\\[[\\s\\S]*?\\n\\s*\\]),?`, 'g');
      let match;
      while ((match = semanticPattern.exec(afterColors)) !== null) {
        misplacedSemanticColors.push({
          key,
          fullMatch: match[0],
          definition: match[2].trim(),
        });
      }
    });

    if (misplacedSemanticColors.length > 0) {
      // Get the colors object closing position
      const colorsClosingPattern = /(colors:\s*\{[\s\S]*?)(\n\s*\},)/;
      const colorsMatch = content.match(colorsClosingPattern);

      if (colorsMatch) {
        const beforeClosing = colorsMatch[1];
        const closingBrace = colorsMatch[2];

        // Determine proper indentation
        const indentMatch = closingBrace.match(/\n(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '  ';

        // Add comma if needed
        const needsComma = !beforeClosing.trim().endsWith(',');
        const commaPrefix = needsComma ? ',' : '';

        if (misplacedSemanticColors.length > 0) {
          // Build semantic colors with proper indentation
          const semanticColorsBlock = misplacedSemanticColors
            .map(item => `${indent}  ${item.definition},`)
            .join('\n');

          // Reconstruct colors object with semantic colors included
          const newColorsObject = `${beforeClosing}${commaPrefix}\n\n${semanticColorsBlock}\n${closingBrace}`;

          // Replace the colors object
          content = content.replace(colorsClosingPattern, newColorsObject);

          // Remove the misplaced semantic colors from their original locations
          misplacedSemanticColors.forEach(item => {
            content = content.replace(item.fullMatch, '');
          });
        }

        changed = true;
        warnings.push(
          `Moved ${misplacedSemanticColors.length} misplaced semantic colors into colors object`
        );
      }
    }
  }

  if (!hasSemanticColorsInColorsObject && !hasMisplacedSemanticColors) {
    let patternFound = false;

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 4: Apply Semantic Colors to Direct Colors Object
    //
    // From:  const colors = { zinc: '#27272a', blue: '#3b82f6' }
    // To:    const colors = { zinc: '#27272a', blue: '#3b82f6', primary: 'var(--color-zinc-900)' }
    //
    /////////////////////////////////////////////////////////////////////////////////
    if (directColorsObject) {
      // More flexible pattern that captures the entire colors object
      const colorsObjectPattern = /(const colors = \{[\s\S]*?)(})/;
      const match = content.match(colorsObjectPattern);

      if (match) {
        const beforeClosing = match[1];
        const closing = match[2];

        // Check if the content before closing brace ends with a comma
        const needsComma = !beforeClosing.trim().endsWith(',');
        const commaPrefix = needsComma ? ',' : '';

        // Add semantic colors before the closing brace with proper indentation
        const semanticColorsBlock = semanticColors.map(color => `  ${color}`).join('\n');
        const newColorsObject = `${beforeClosing}${commaPrefix}\n  ${semanticColorsBlock}\n${closing}`;

        content = content.replace(colorsObjectPattern, newColorsObject);
        changed = true;
        patternFound = true;
      }
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 5: Apply Semantic Colors to Nested Colors Object
    //
    // From:  colors: { zinc: ['#fafafa', '#27272a'], blue: ['#eff6ff', '#1e40af'] }
    // To:    colors: { zinc: ['#fafafa', '#27272a'], blue: ['#eff6ff', '#1e40af'], primary: ['var(--color-zinc-50)', 'var(--color-zinc-900)'] }
    //
    /////////////////////////////////////////////////////////////////////////////////
    if (!patternFound && (nestedColorsObject || stylesColorsObject)) {
      // Use a more robust regex that handles both patterns:
      // 1. colors: { ... }; (direct colors object)
      // 2. colors: { ... }, (nested colors object in styles)
      const colorsPattern = /(colors:\s*\{[\s\S]*?)(\n\s*}[,;]?)/;
      const match = content.match(colorsPattern);

      if (match) {
        const beforeClosing = match[1];
        const closingWithIndent = match[2];

        // Check if the content before closing brace ends with a comma
        const needsComma = !beforeClosing.trim().endsWith(',');
        const commaPrefix = needsComma ? ',' : '';

        // Extract the indentation from the closing brace line
        const indentMatch = closingWithIndent.match(/\n(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '  ';

        // Add semantic colors before the closing brace with proper indentation
        const semanticColorsBlock = semanticColors.map(color => `${indent}  ${color}`).join('\n');
        const newColorsObject = `${beforeClosing}${commaPrefix}\n\n${semanticColorsBlock}\n${closingWithIndent}`;

        content = content.replace(colorsPattern, newColorsObject);
        changed = true;
        patternFound = true;
      }
    }

    if (!patternFound) {
      warnings.push('Could not find colors object pattern to add semantic colors');
    }
  } else if (hasSemanticColorsInColorsObject) {
    warnings.push('Semantic colors already exist in colors object');
  }

  return { content, changed, warnings };
}
