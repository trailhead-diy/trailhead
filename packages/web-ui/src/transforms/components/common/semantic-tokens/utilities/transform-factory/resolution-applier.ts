/**
 * Resolution application utilities
 */

import type { TransformContext, ComponentConfig } from './types.js'

/**
 * Apply semantic resolution to component
 * Handles custom logic or defaults
 */
export function applySemanticResolution(functionBody: any, context: TransformContext): void {
  const { root, j, config, changes } = context
  const { variableName = 'resolvedColorClasses', hasColorsObject, applyResolution } = config

  if (applyResolution) {
    // Use custom resolution logic
    applyResolution(root, j, variableName)
  } else if (hasColorsObject) {
    // Default: replace colors[color] with resolved variable
    applyDefaultColorsResolution(root, j, variableName)
  } else {
    // For components without colors, add to className
    applyClassNameResolution(functionBody, j, variableName, changes)
  }
}

/**
 * Apply default resolution for components with colors object
 * Replaces colors[color] with resolved variable
 */
function applyDefaultColorsResolution(root: any, j: any, variableName: string): void {
  root
    .find(j.MemberExpression, {
      object: { name: 'colors' },
    })
    .forEach((memberPath: any) => {
      j(memberPath).replaceWith(j.identifier(variableName))
    })
}

/**
 * Apply resolution by adding to className
 * For components without colors object
 */
function applyClassNameResolution(
  functionBody: any,
  j: any,
  variableName: string,
  changes: any[]
): void {
  j(functionBody)
    .find(j.JSXAttribute, {
      name: { name: 'className' },
    })
    .forEach((attrPath: any) => {
      const value = attrPath.node.value

      if (
        value?.type === 'JSXExpressionContainer' &&
        value.expression?.type === 'CallExpression' &&
        value.expression.callee?.name === 'cn'
      ) {
        // Add resolved variable to cn() call
        value.expression.arguments.push(j.identifier(variableName))

        changes.push({
          type: 'logic',
          description: 'Added semantic styles to className',
        })
      }
    })
}

/**
 * Check if resolution is needed
 * Pure function for validation
 */
export function needsResolution(functionBody: any, j: any, config: ComponentConfig): boolean {
  const { hasColorsObject, variableName = 'resolvedColorClasses' } = config

  // Check if variable already exists
  const hasVariable =
    j(functionBody).find(j.VariableDeclarator, {
      id: { name: variableName },
    }).length > 0

  if (hasVariable) return false

  // Check if colors object is used
  if (hasColorsObject) {
    const usesColors =
      j(functionBody).find(j.MemberExpression, {
        object: { name: 'colors' },
      }).length > 0

    return usesColors
  }

  // For components without colors, always add if className exists
  return (
    j(functionBody).find(j.JSXAttribute, {
      name: { name: 'className' },
    }).length > 0
  )
}
