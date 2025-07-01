/**
 * Remove unused className parameters
 * Removes className from components that don't actually use it
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js'
import type { JSCodeshift, Collection } from 'jscodeshift'

/**
 * Remove unused className parameters from components
 */
function removeUnusedClassName(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = []

  // Helper to check if className is used in component body
  function isClassNameUsed(componentBody: any, j: JSCodeshift): boolean {
    let used = false
    
    j(componentBody)
      .find(j.Identifier, { name: 'className' })
      .forEach((path) => {
        // Check if it's not the parameter itself
        const parent = path.parent
        if (parent.node.type !== 'Property' || parent.parent.node.type !== 'ObjectPattern') {
          used = true
        }
      })
    
    return used
  }

  // Process function components
  root.find(j.FunctionDeclaration).forEach((path) => {
    const componentName = path.node.id?.name || 'unknown'
    
    if (path.node.params.length > 0 && path.node.params[0].type === 'ObjectPattern') {
      const objectPattern = path.node.params[0]
      const classNamePropIndex = objectPattern.properties.findIndex((prop: any) => 
        prop.type === 'Property' && 
        prop.key.type === 'Identifier' && 
        prop.key.name === 'className'
      )
      
      if (classNamePropIndex >= 0 && !isClassNameUsed(path.node.body, j)) {
        objectPattern.properties.splice(classNamePropIndex, 1)
        changes.push({
          type: 'parameter-removal',
          description: `Removed unused className parameter from ${componentName}`,
        })
      }
    }
  })

  // Process arrow function components
  root.find(j.VariableDeclarator).forEach((path) => {
    const node = path.node
    const componentName = node.id?.type === 'Identifier' ? node.id.name : 'unknown'
    
    if (node.init?.type === 'ArrowFunctionExpression' &&
        node.init.params.length > 0 && 
        node.init.params[0].type === 'ObjectPattern') {
      const objectPattern = node.init.params[0]
      const classNamePropIndex = objectPattern.properties.findIndex((prop: any) => 
        prop.type === 'Property' && 
        prop.key.type === 'Identifier' && 
        prop.key.name === 'className'
      )
      
      if (classNamePropIndex >= 0 && !isClassNameUsed(node.init.body, j)) {
        objectPattern.properties.splice(classNamePropIndex, 1)
        changes.push({
          type: 'parameter-removal',
          description: `Removed unused className parameter from ${componentName}`,
        })
      }
    }
  })

  return changes
}

/**
 * Remove unused className transform
 * Created using AST transform factory for DRY implementation
 */
export const removeUnusedClassNameTransform = createASTTransform({
  name: 'remove-unused-className',
  description: 'Remove unused className parameters',
  transform: (root, j) => removeUnusedClassName(root, j),
})