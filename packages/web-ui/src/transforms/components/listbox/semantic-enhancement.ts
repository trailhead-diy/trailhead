/**
 * Semantic enhancement transform for Listbox component
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

export const listboxSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Listbox',
  
  // Detection pattern - check for Listbox function declaration
  detectPattern: (content: string) => {
    return content.includes('export function Listbox') &&
           content.includes('Headless.Listbox')
  },
  
  // Default color fallback
  defaultColor: 'primary',
  
  // Listbox doesn't have a type alias or props interface for color
  typePattern: 'none',
  
  // Not using forwardRef
  isForwardRef: false,
  
  // No colors object in this component
  hasColorsObject: false,
  
  // Variable name for resolved classes
  variableName: 'resolvedColorClasses',
  
  // Don't use IIFE pattern
  useIIFE: false,
  
  // Custom resolution application
  applyResolution: (root, j, variableName) => {
    // Add resolved color classes to the main Listbox element
    root.find(j.JSXOpeningElement, { name: { name: 'Headless.Listbox' } })
      .forEach((path: any) => {
        const parent = path.parent
        if (parent && parent.node.type === 'JSXElement') {
          // Find the span element that wraps the button and options
          j(parent).find(j.JSXElement, {
            openingElement: {
              name: { name: 'span' },
              attributes: [{ name: { name: 'data-slot' }, value: { value: 'control' } }]
            }
          }).forEach((spanPath: any) => {
            const className = spanPath.node.openingElement.attributes?.find(
              (attr: any) => attr.type === 'JSXAttribute' && attr.name?.name === 'className'
            )
            
            if (className && 
                className.type === 'JSXAttribute' &&
                className.value?.type === 'JSXExpressionContainer' &&
                className.value.expression?.type === 'CallExpression' &&
                className.value.expression.callee?.name === 'cn') {
              // Add resolvedColorClasses to the cn() call
              className.value.expression.arguments.push(j.identifier(variableName))
            }
          })
        }
      })
  }
})