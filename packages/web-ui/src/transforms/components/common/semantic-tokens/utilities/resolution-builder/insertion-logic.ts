/**
 * AST insertion logic for semantic token resolution
 */

import type { API, VariableDeclaration } from 'jscodeshift';

/**
 * Check if a variable already exists in the given scope
 * Pure function that returns true if variable exists
 */
export function checkVariableExists(
  j: API['jscodeshift'],
  functionBody: any,
  variableName: string
): boolean {
  const existingVariable = j(functionBody).find(j.VariableDeclarator, {
    id: { name: variableName },
  });

  return existingVariable.length > 0;
}

/**
 * Extract variable name from declaration
 * Pure function that safely extracts the variable name
 */
export function extractVariableName(resolution: VariableDeclaration): string | null {
  const firstDeclarator = resolution.declarations[0] as any;

  if (!firstDeclarator || !firstDeclarator.id || firstDeclarator.id.type !== 'Identifier') {
    return null;
  }

  return firstDeclarator.id.name as string;
}

/**
 * Find the insertion point for the resolution
 * Returns the return statement collection or null
 */
export function findInsertionPoint(j: API['jscodeshift'], functionBody: any): any {
  const returnStatement = j(functionBody).find(j.ReturnStatement).at(0);

  return returnStatement.length > 0 ? returnStatement : null;
}

/**
 * Insert semantic resolution before return statement
 * Main insertion function that coordinates the process
 */
export function insertSemanticResolution(
  j: API['jscodeshift'],
  functionBody: any,
  resolution: VariableDeclaration
): boolean {
  // Extract variable name
  const variableName = extractVariableName(resolution);
  if (!variableName) {
    return false;
  }

  // Check if variable already exists
  if (checkVariableExists(j, functionBody, variableName)) {
    return false;
  }

  // Find insertion point
  const insertionPoint = findInsertionPoint(j, functionBody);
  if (!insertionPoint) {
    return false;
  }

  // Insert the resolution
  insertionPoint.insertBefore(resolution);
  return true;
}

/**
 * Insert resolution at the beginning of function body
 * Alternative insertion strategy for functions without return statements
 */
export function insertAtBeginning(
  j: API['jscodeshift'],
  functionBody: any,
  resolution: VariableDeclaration
): boolean {
  // Extract variable name
  const variableName = extractVariableName(resolution);
  if (!variableName) {
    return false;
  }

  // Check if variable already exists
  if (checkVariableExists(j, functionBody, variableName)) {
    return false;
  }

  // Insert at the beginning of the function body
  if (functionBody.body && Array.isArray(functionBody.body)) {
    functionBody.body.unshift(resolution);
    return true;
  }

  return false;
}
