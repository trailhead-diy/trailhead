/**
 * Semicolon-related formatting functions
 */

/**
 * Fix function ending semicolons
 * Removes extra semicolons from function endings to match style guide
 */
export const fixFunctionEndingSemicolons = (code: string): string => {
  return code.replace(/^(\s*\});$/gm, '$1}');
};

/**
 * Remove trailing semicolons from export statements
 * Ensures consistent export formatting
 */
export const removeExportSemicolons = (code: string): string => {
  return code.replace(/^(export .+);$/gm, '$1');
};

/**
 * Add semicolons to variable declarations
 * Ensures variable declarations have proper semicolons
 */
export const addVariableSemicolons = (code: string): string => {
  return code.replace(/^(const|let|var)(.+[^;{])$/gm, '$1$2;');
};
