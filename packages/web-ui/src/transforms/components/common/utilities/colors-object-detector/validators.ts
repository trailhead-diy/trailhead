/**
 * Colors object validation functions
 *
 * These functions validate that colors object transformations preserve integrity
 */

/**
 * Validates that colors object CSS variables are preserved
 * Useful for testing and validation
 */
export function validateColorsObjectPreservation(
  originalContent: string,
  transformedContent: string
): { isValid: boolean; violations: string[] } {
  // Pattern for CSS variables in colors objects (more specific than general CSS vars)
  const colorsVarPattern = /\[--[\w-]+:.*var\(--color-[\w-]+\).*\]/g

  const originalVars = Array.from(originalContent.matchAll(colorsVarPattern))

  const violations: string[] = []

  // Check if any colors CSS variables were removed or modified
  for (const originalVar of originalVars) {
    const varString = originalVar[0]
    if (!transformedContent.includes(varString)) {
      violations.push(`Colors CSS variable removed or modified: ${varString}`)
    }
  }

  // Additional check: ensure colors object structure is preserved
  const colorsObjectPattern = /const\s+colors\s*=\s*\{/
  const hasOriginalColors = colorsObjectPattern.test(originalContent)
  const hasTransformedColors = colorsObjectPattern.test(transformedContent)

  if (hasOriginalColors && !hasTransformedColors) {
    violations.push('Colors object declaration was removed or modified')
  }

  return {
    isValid: violations.length === 0,
    violations,
  }
}

/**
 * Validates a single colors object structure
 * Returns true if the structure is valid
 */
export function isValidColorsObject(content: string): boolean {
  // Basic structure validation
  const colorsPattern = /const\s+colors\s*=\s*\{[\s\S]*?\}/
  const match = content.match(colorsPattern)

  if (!match) return false

  const colorsContent = match[0]

  // Check for required structure elements
  const hasColorKeys = /['"`]\w+(?:\/\w+)?['"`]\s*:\s*\[/.test(colorsContent)
  const hasCSSVariables = /\[--[\w-]+:.*var\(--color-[\w-]+\).*\]/.test(colorsContent)

  return hasColorKeys && hasCSSVariables
}

/**
 * Extract color names from a colors object
 * Returns array of color names for analysis
 */
export function extractColorNames(colorsObjectContent: string): string[] {
  const colorNames: string[] = []
  const pattern = /['"`](\w+(?:\/\w+)?)['"`]\s*:\s*\[/g

  let match
  while ((match = pattern.exec(colorsObjectContent)) !== null) {
    colorNames.push(match[1])
  }

  return colorNames
}
