/**
 * Prop enhancement utilities
 */

import type { TransformContext } from './types.js'

/**
 * Add color prop to component parameters if needed
 * Returns true if prop was added
 */
export function addColorPropIfNeeded(
  params: any[],
  j: any,
  context: TransformContext
): boolean {
  const { config, changes } = context
  
  if (config.typePattern !== 'none' || params.length === 0) {
    return false
  }
  
  const firstParam = params[0]
  if (firstParam.type !== 'ObjectPattern') {
    return false
  }
  
  const hasColorProp = firstParam.properties.some(
    (prop: any) => prop.type === 'ObjectProperty' && prop.key.name === 'color'
  )
  
  if (!hasColorProp) {
    // Find the index of the rest element (...props) to insert color before it
    const restElementIndex = firstParam.properties.findIndex(
      (prop: any) => prop.type === 'RestElement'
    )
    
    const colorProp = j.objectProperty(
      j.identifier('color'),
      j.identifier('color'),
      false,
      true // shorthand
    )
    
    if (restElementIndex !== -1) {
      // Insert color prop before the rest element
      firstParam.properties.splice(restElementIndex, 0, colorProp)
    } else {
      // No rest element found, add at the end
      firstParam.properties.push(colorProp)
    }
    
    changes.push({
      type: 'prop',
      description: `Added color prop to ${config.name} component`,
    })
    
    return true
  }
  
  return false
}

/**
 * Check if component already has color prop
 * Pure function for validation
 */
export function hasColorProp(params: any[]): boolean {
  if (params.length === 0) return false
  
  const firstParam = params[0]
  if (firstParam.type !== 'ObjectPattern') return false
  
  return firstParam.properties.some(
    (prop: any) => prop.type === 'ObjectProperty' && prop.key.name === 'color'
  )
}