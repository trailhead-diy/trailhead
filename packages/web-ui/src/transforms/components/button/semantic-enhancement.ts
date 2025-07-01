/**
 * Button semantic enhancement transform (refactored)
 * Uses the transform factory for DRY implementation
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Button semantic enhancement transform
 * Adds semantic token support to the Button component
 */
export const buttonSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Button',
  detectPattern: (content) => 
    content.includes('export const Button') && 
    content.includes('ButtonProps'),
  defaultColor: 'dark/zinc',
  typePattern: 'none', // Button adds color prop directly
  hasColorsObject: true,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
  
  // Button-specific resolution application
  applyResolution: (root, j, variableName) => {
    // Replace all colors[color ?? 'dark/zinc'] with resolvedColorClasses
    root.find(j.MemberExpression, {
      object: { name: 'colors' }
    }).forEach((path: any) => {
      // Check if this is the specific pattern we want to replace
      const parent = path.parent
      if (parent.value?.type === 'CallExpression' && 
          parent.value.callee?.name === 'cn') {
        j(path).replaceWith(j.identifier(variableName))
      }
    })
  }
})
