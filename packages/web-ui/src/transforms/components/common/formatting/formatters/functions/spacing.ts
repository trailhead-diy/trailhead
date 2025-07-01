/**
 * Spacing-related formatting functions
 */

/**
 * Normalize blank lines in code
 * Removes excessive blank lines while preserving structure
 */
export const normalizeBlankLines = (code: string): string => {
  return code.replace(/\n{3,}/g, '\n\n')
}

/**
 * Add spacing around functions
 * Ensures functions have proper spacing for readability
 */
export const addFunctionSpacing = (code: string): string => {
  return code
    // Add blank line before function declarations
    .replace(/([^\n])\n(export\s+)?function/g, '$1\n\n$2function')
    // Add blank line before arrow functions
    .replace(/([^\n])\n(export\s+)?const\s+\w+\s*=\s*\(/g, '$1\n\n$2const $3 = (')
}

/**
 * Clean up trailing whitespace
 * Removes unnecessary whitespace at line ends
 */
export const removeTrailingWhitespace = (code: string): string => {
  return code.replace(/[ \t]+$/gm, '')
}