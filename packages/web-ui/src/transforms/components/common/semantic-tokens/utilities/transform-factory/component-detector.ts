/**
 * Component detection utilities
 */

import type { ComponentConfig } from './types.js'

/**
 * Check if content contains the target component
 * Pure function that performs quick pattern matching
 */
export function shouldTransformContent(
  content: string,
  config: ComponentConfig
): boolean {
  return config.detectPattern(content)
}

/**
 * Find component declaration in AST
 * Returns the path to the component function
 */
export function findComponentDeclaration(
  root: any,
  j: any,
  config: ComponentConfig
): any[] {
  const { name, isForwardRef } = config

  if (isForwardRef) {
    // Find forwardRef call
    return root.find(j.CallExpression, {
      callee: { name: 'forwardRef' }
    }).filter((_path: any) => {
      // Additional validation could go here
      return true
    }).paths()
  } else {
    // Find function declaration
    return root.find(j.FunctionDeclaration, {
      id: { name }
    }).paths()
  }
}

/**
 * Extract function body from component declaration
 * Handles both regular functions and forwardRef
 */
export function extractFunctionBody(
  path: any,
  config: ComponentConfig
): any {
  if (config.isForwardRef) {
    const forwardRefArg = path.node.arguments[0]
    if (forwardRefArg?.type === 'FunctionExpression' ||
      forwardRefArg?.type === 'ArrowFunctionExpression') {
      return forwardRefArg.body
    }
  } else {
    return path.node.body
  }

  return null
}

/**
 * Get function parameters from component
 * Handles both regular functions and forwardRef
 */
export function getFunctionParams(
  path: any,
  config: ComponentConfig
): any[] {
  if (config.isForwardRef) {
    const forwardRefArg = path.node.arguments[0]
    if (forwardRefArg?.type === 'FunctionExpression' ||
      forwardRefArg?.type === 'ArrowFunctionExpression') {
      return forwardRefArg.params
    }
  } else {
    return path.node.params
  }

  return []
}