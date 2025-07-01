/**
 * Fieldset semantic enhancement transform
 *
 * Fixes critical issue: ErrorMessage component uses hardcoded red colors
 * instead of semantic destructive tokens, breaking theme consistency
 */

import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

/**
 * Fieldset semantic enhancement transform
 * Replaces hardcoded red error colors with semantic destructive tokens
 *
 * Target: ErrorMessage component at line 99-100
 * Before: 'text-red-600 data-disabled:opacity-50 sm:text-sm/6 dark:text-red-500'
 * After: 'text-destructive data-disabled:opacity-50 sm:text-sm/6 dark:text-destructive'
 */
export const fieldsetSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Fieldset',
  detectPattern: (content) =>
    content.includes('export function Fieldset') &&
    content.includes('export function ErrorMessage') &&
    content.includes('text-red-600') &&
    content.includes('dark:text-red-500'),
  defaultColor: 'destructive', // Error messages should use destructive semantic token
  typePattern: 'none', // Fieldset doesn't expose color props - this is an internal fix
  hasColorsObject: false,
  variableName: 'errorClasses',
  useIIFE: false,

  // Custom application logic for fieldset - replace hardcoded red with semantic destructive
  applyResolution: (root: any, j: any, _variableName: string) => {
    // Find ErrorMessage component and replace hardcoded red colors
    root
      .find(j.JSXAttribute, {
        name: { name: 'className' },
      })
      .forEach((path: any) => {
        const value = path.node.value
        if (
          value?.type === 'JSXExpressionContainer' &&
          value.expression?.type === 'CallExpression' &&
          value.expression.callee?.name === 'cn'
        ) {
          // Look for the string containing hardcoded red colors
          value.expression.arguments.forEach((arg: any, index: number) => {
            if (
              arg.type === 'StringLiteral' &&
              arg.value.includes('text-red-600') &&
              arg.value.includes('dark:text-red-500')
            ) {
              // Replace hardcoded red colors with semantic destructive
              const updatedValue = arg.value
                .replace('text-red-600', 'text-destructive')
                .replace('dark:text-red-500', 'dark:text-destructive')

              value.expression.arguments[index] = j.stringLiteral(updatedValue)
            }
          })
        }
      })
  },
})
