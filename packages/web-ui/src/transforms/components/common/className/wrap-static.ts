/**
 * Wrap static className strings with cn()
 * Transforms className="foo" → className={cn('foo')}
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js'

/**
 * Wrap static className transform
 * Created using AST transform factory for DRY implementation
 */
export const wrapStaticClassNameTransform = createASTTransform({
  name: 'wrap-static-className',
  description: 'Wrap static className strings with cn()',
  transform: (root, j) => {
    const changes: any[] = []
    
    // Find JSX attributes with name="className"
    root
      .find(j.JSXAttribute, {
        name: { type: 'JSXIdentifier', name: 'className' },
      })
      .forEach((path) => {
        const value = path.node.value
        
        // Only process string literals
        if (value?.type === 'StringLiteral' || value?.type === 'Literal') {
          // Create cn() call
          const cnCall = j.jsxExpressionContainer(
            j.callExpression(j.identifier('cn'), [j.stringLiteral(value.value as string)])
          )
          
          path.node.value = cnCall
          changes.push({
            type: 'className',
            description: 'Wrapped static className strings with cn()',
          })
        }
      })
    
    return changes
  }
})