/**
 * Style Object Protection Utilities
 *
 * - Pure functions for detecting style object contexts
 * - Immutable data structures for analysis
 * - Single responsibility for each detection function
 * - Functional composition for complex detection
 */

/**
 * Detects if a position is within a style object definition
 * Style objects follow patterns like:
 * ```
 * const styles = {
 *   colors: {
 *     'dark/zinc': ['[--btn-bg:var(--color-zinc-900)]']
 *   }
 * }
 * ```
 */
export function isWithinStyleObject(content: string, position: number): boolean {
  // Get content before the position to analyze context
  const beforeContent = content.slice(0, position);

  // Find all opening and closing braces to determine nesting level
  const braces = [];
  for (let i = 0; i < beforeContent.length; i++) {
    if (beforeContent[i] === '{') {
      braces.push({ type: 'open', pos: i });
    } else if (beforeContent[i] === '}') {
      braces.push({ type: 'close', pos: i });
    }
  }

  // Calculate current nesting level
  let nestingLevel = 0;
  for (const brace of braces) {
    if (brace.type === 'open') {
      nestingLevel++;
    } else {
      nestingLevel--;
    }
  }

  // Must be inside at least one brace to be in a style object
  if (nestingLevel === 0) {
    return false;
  }

  // Look for style object indicators going backwards
  const lines = beforeContent.split('\n');

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();

    // Pattern 1: const styles = { ... }
    if (/^const\s+styles\s*=\s*\{/.test(line)) {
      return true;
    }

    // Pattern 2: colors: { ... } (within a styles object)
    if (/^colors\s*:\s*\{/.test(line)) {
      return true;
    }

    // Pattern 3: Color key like 'zinc': '...' or 'dark/zinc': [
    if (/^['"`]\w+(?:\/\w+)?['"`]\s*:\s*/.test(line)) {
      return true;
    }

    // Pattern 4: Array strings within color definitions
    if (/^\s*['"`].*['"`],?\s*$/.test(line) && nestingLevel >= 2) {
      return true;
    }

    // Stop looking if we find a function or export
    if (/^(export\s+)?(function|const\s+\w+\s*=)/.test(line) && !line.includes('styles')) {
      break;
    }
  }

  return false;
}

/**
 * Detects if a position is within a CSS variable definition
 * CSS variables follow patterns like: [--btn-bg:var(--color-zinc-900)]
 */
export function isWithinCSSVariable(content: string, position: number): boolean {
  // Get a reasonable window around the position
  const start = Math.max(0, position - 100);
  const end = Math.min(content.length, position + 100);
  const window = content.slice(start, end);
  const relativePos = position - start;

  // Find CSS variable brackets around the position
  const beforePos = window.slice(0, relativePos);
  const afterPos = window.slice(relativePos);

  const lastOpenBracket = beforePos.lastIndexOf('[--');
  const nextCloseBracket = afterPos.indexOf(']');

  // Check if we're inside a CSS variable definition
  if (lastOpenBracket !== -1 && nextCloseBracket !== -1) {
    // Verify it contains var(--color-*) pattern
    const cssVar = window.slice(lastOpenBracket, relativePos + nextCloseBracket + 1);
    return /\[--[\w-]+:var\(--color-[\w-]+\)\]/.test(cssVar);
  }

  return false;
}

/**
 * Detects if a position is within a style array element
 * Style arrays contain className strings that should be transformed
 */
export function isWithinStyleArray(content: string, position: number): boolean {
  const beforeContent = content.slice(0, position);

  // Find the nearest array bracket
  const lastOpenArray = beforeContent.lastIndexOf('[');
  const lastCloseArray = beforeContent.lastIndexOf(']');

  // Must be inside an array
  if (lastOpenArray === -1 || lastCloseArray > lastOpenArray) {
    return false;
  }

  // Check if this array is part of a style object
  const beforeArray = beforeContent.slice(0, lastOpenArray);

  // Pattern: 'colorName': [ ... ] within a colors object
  const colorArrayPattern = /['"`]\w+(?:\/\w+)?['"`]\s*:\s*$/;
  return colorArrayPattern.test(beforeArray);
}

/**
 * Creates a protection function that excludes style object contexts
 * Returns true if the match should be excluded from transformation
 */
export function createStyleObjectProtection() {
  return function shouldExcludeMatch(content: string, match: RegExpMatchArray): boolean {
    if (match.index === undefined) return false;

    const position = match.index;

    // Exclude if within a CSS variable definition
    if (isWithinCSSVariable(content, position)) {
      return true;
    }

    // Exclude if within a style object
    if (isWithinStyleObject(content, position)) {
      return true;
    }
    return false;
  };
}

/**
 * Enhanced regex replacer that respects style object contexts
 */
export function createProtectedReplacer(
  pattern: RegExp,
  replacement: string | ((match: string, ...args: any[]) => string)
) {
  const shouldExclude = createStyleObjectProtection();

  return function protectedReplace(content: string): string {
    return content.replace(pattern, (match, ...args) => {
      const offset = args[args.length - 2]; // offset is second to last arg
      if (typeof offset === 'number') {
        // Create a proper match object for protection check
        const matchObj = Object.assign([match], { index: offset }) as RegExpMatchArray;

        if (shouldExclude(content, matchObj)) {
          return match; // Return original match unchanged
        }
      }

      // Apply the transformation
      if (typeof replacement === 'function') {
        return replacement(match, ...args);
      }
      return replacement;
    });
  };
}

/**
 * Validates that CSS variables are preserved in style objects
 * Useful for testing and validation
 */
export function validateCSSVariablePreservation(
  originalContent: string,
  transformedContent: string
): { isValid: boolean; violations: string[] } {
  const cssVarPattern = /\[--[\w-]+:var\(--color-[\w-]+\)\]/g;

  const originalVars = Array.from(originalContent.matchAll(cssVarPattern));

  const violations: string[] = [];

  // Check if any CSS variables were removed or modified
  for (const originalVar of originalVars) {
    const varString = originalVar[0];
    if (!transformedContent.includes(varString)) {
      violations.push(`CSS variable removed or modified: ${varString}`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}
