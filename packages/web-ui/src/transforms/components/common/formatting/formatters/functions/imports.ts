/**
 * Import-related formatting functions
 */

/**
 * Fix import semicolons to match traditional mixed pattern
 * Traditional: some imports have semicolons, some don't - keep the original pattern
 */
export const fixImportSemicolons = (code: string): string => {
  return (
    code
      // First normalize all imports to no semicolons
      .replace(/^(import .+);$/gm, '$1')
      // Then add semicolons only to imports ending with .js (traditional pattern)
      .replace(/^(import .+from '[^']+\.js')$/gm, '$1;')
  );
};

/**
 * Remove extra blank lines between imports but preserve spacing structure
 * Normalize import spacing while maintaining readability
 */
export const normalizeImportSpacing = (code: string): string => {
  return code.replace(/^(import .+)\n\n+(import .+)/gm, '$1\n$2');
};

/**
 * Ensure single blank line after last import before other code
 * Maintains consistent spacing between imports and component code
 */
export const ensureBlankLineAfterImports = (code: string): string => {
  return code.replace(/^(import .+)\n\n*(.+)/gm, (match, importLine, nextLine) => {
    if (nextLine.startsWith('import ')) {
      return `${importLine}\n${nextLine}`;
    }
    return `${importLine}\n\n${nextLine}`;
  });
};
