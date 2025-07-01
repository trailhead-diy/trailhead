/**
 * Colors object detection functions
 *
 * These functions detect if a position is within various colors object contexts
 */

/**
 * Detects if a position is within a colors object definition
 * Colors objects follow patterns like:
 * ```
 * const colors = {
 *   'dark/zinc': [
 *     '[--switch-bg-ring:var(--color-foreground)]/90 [--switch-bg:var(--color-foreground)]',
 *     '[--switch-ring:var(--color-foreground)]/90 [--switch-shadow:var(--color-black)]/10'
 *   ],
 *   zinc: [
 *     '[--switch-bg-ring:var(--color-muted-foreground)]/90'
 *   ]
 * }
 * ```
 * OR
 * ```
 * const styles = {
 *   colors: {
 *     'dark/zinc': [...]
 *   }
 * }
 * ```
 */
export function isWithinColorsObject(content: string, position: number): boolean {
  // Get content before the position to analyze context
  const beforeContent = content.slice(0, position)

  // Pattern 1: Find the closest `const colors = {` declaration going backwards
  const standaloneColorsPattern = /const\s+colors\s*=\s*\{/g
  let colorsMatch
  let lastColorsStart = -1

  // Find the last occurrence of standalone colors declaration before our position
  while ((colorsMatch = standaloneColorsPattern.exec(beforeContent)) !== null) {
    lastColorsStart = colorsMatch.index
  }

  // Pattern 2: Find `colors: {` inside an object (like styles.colors)
  const nestedColorsPattern = /\bcolors\s*:\s*\{/g
  let nestedMatch
  let lastNestedStart = -1

  // Find the last occurrence of nested colors declaration before our position
  while ((nestedMatch = nestedColorsPattern.exec(beforeContent)) !== null) {
    lastNestedStart = nestedMatch.index
  }

  // Use the most recent colors declaration (either standalone or nested)
  const colorsStart = Math.max(lastColorsStart, lastNestedStart)

  // If no colors declaration found, not in colors object
  if (colorsStart === -1) {
    return false
  }

  // Find the matching closing brace for the colors object
  let braceCount = 0
  let inColorsObject = false
  let colorsEnd = -1

  for (let i = colorsStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++
      if (braceCount === 1) {
        inColorsObject = true
      }
    } else if (content[i] === '}') {
      braceCount--
      if (braceCount === 0 && inColorsObject) {
        colorsEnd = i
        break
      }
    }
  }

  // Check if our position is within the colors object bounds
  if (colorsEnd === -1) {
    // Colors object is not closed, check if we're after the opening brace
    const openBracePos = content.indexOf('{', colorsStart)
    return openBracePos !== -1 && position > openBracePos
  } else {
    // Colors object is properly closed, check if we're within bounds
    const openBracePos = content.indexOf('{', colorsStart)
    return position > openBracePos && position < colorsEnd
  }
}

/**
 * Detects if a position is within a styles object definition
 * Styles objects contain colors and other style definitions that should be preserved
 * ```
 * const styles = {
 *   base: [...],
 *   colors: {
 *     'dark/zinc': [...]
 *   }
 * }
 * ```
 */
export function isWithinStylesObject(content: string, position: number): boolean {
  // Get content before the position to analyze context
  const beforeContent = content.slice(0, position)

  // Find the closest `const styles = {` declaration going backwards
  const stylesPattern = /const\s+styles\s*=\s*\{/g
  let stylesMatch
  let lastStylesStart = -1

  // Find the last occurrence of styles declaration before our position
  while ((stylesMatch = stylesPattern.exec(beforeContent)) !== null) {
    lastStylesStart = stylesMatch.index
  }

  // If no styles declaration found, not in styles object
  if (lastStylesStart === -1) {
    return false
  }

  // Find the matching closing brace for the styles object
  let braceCount = 0
  let inStylesObject = false
  let stylesEnd = -1

  for (let i = lastStylesStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++
      if (braceCount === 1) {
        inStylesObject = true
      }
    } else if (content[i] === '}') {
      braceCount--
      if (braceCount === 0 && inStylesObject) {
        stylesEnd = i
        break
      }
    }
  }

  // Check if our position is within the styles object bounds
  if (stylesEnd === -1) {
    // Styles object is not closed, check if we're after the opening brace
    const openBracePos = beforeContent.indexOf('{', lastStylesStart)
    return openBracePos !== -1 && position > openBracePos
  } else {
    // Styles object is properly closed, check if we're within bounds
    const openBracePos = content.indexOf('{', lastStylesStart)
    return position > openBracePos && position < stylesEnd
  }
}

/**
 * Detects if a position is within a colors array element
 * Colors arrays contain CSS variable strings that should be preserved
 */
export function isWithinColorsArray(content: string, position: number): boolean {
  const beforeContent = content.slice(0, position)

  // Find the nearest array bracket
  const lastOpenArray = beforeContent.lastIndexOf('[')
  const lastCloseArray = beforeContent.lastIndexOf(']')

  // Must be inside an array
  if (lastOpenArray === -1 || lastCloseArray > lastOpenArray) {
    return false
  }

  // Check if this array is part of a colors object
  const beforeArray = beforeContent.slice(0, lastOpenArray)

  // Pattern: 'colorName': [ ... ] within a colors object
  const colorArrayPattern = /['"`]\w+(?:\/\w+)?['"`]\s*:\s*$/
  if (!colorArrayPattern.test(beforeArray)) {
    return false
  }

  // Additional check: ensure we're in a colors object context
  const lines = beforeArray.split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    // Check for both standalone and nested colors
    if (/^const\s+colors\s*=\s*\{/.test(line) || /\bcolors\s*:\s*\{/.test(line)) {
      return true
    }
    // Stop at function boundaries
    if (
      /^(export\s+)?(function|const\s+\w+\s*=)/.test(line) &&
      !/const\s+(colors|styles)\s*=/.test(line)
    ) {
      break
    }
  }

  return false
}

/**
 * Detects if a position is within a CSS variable in a colors definition
 * Similar to isWithinCSSVariable but specific to colors objects
 */
export function isWithinColorsCSSVariable(content: string, position: number): boolean {
  // Get a reasonable window around the position
  const start = Math.max(0, position - 200)
  const end = Math.min(content.length, position + 200)
  const window = content.slice(start, end)
  const relativePos = position - start

  // Find CSS variable brackets around the position
  const beforePos = window.slice(0, relativePos)
  const afterPos = window.slice(relativePos)

  const lastOpenBracket = beforePos.lastIndexOf('[--')
  const nextCloseBracket = afterPos.indexOf(']')

  // Check if we're inside a CSS variable definition
  if (lastOpenBracket !== -1 && nextCloseBracket !== -1) {
    // Verify it contains var(--color-*) pattern and we're in a colors context
    const cssVar = window.slice(lastOpenBracket, relativePos + nextCloseBracket + 1)
    const hasCSSVar = /\[--[\w-]+:.*var\(--color-[\w-]+\).*\]/.test(cssVar)

    if (hasCSSVar) {
      // Verify we're within a colors object (either standalone or nested)
      return isWithinColorsObject(content, position) || isWithinStylesObject(content, position)
    }
  }

  return false
}
