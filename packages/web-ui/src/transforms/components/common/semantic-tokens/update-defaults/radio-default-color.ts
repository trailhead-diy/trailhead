/**
 * Transform to update Radio component default color from 'dark/zinc' to 'primary'
 *
 * This transform specifically targets the default value in the Radio component
 * and updates it to use the semantic 'primary' token instead of the hardcoded 'dark/zinc' value.
 */

import { API, FileInfo } from 'jscodeshift'
import { STANDARD_AST_FORMAT_OPTIONS } from '@/transforms/components/common/formatting/ast-options.js'
import type { Transform, TransformResult } from '@/transforms/shared/types.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/**
 * Update Radio default color transform
 */
export const radioDefaultColorTransform: Transform = {
  name: 'radio-default-color-update',
  description: 'Update Radio component default color from dark/zinc to primary',
  type: 'ast',

  execute(content: string): TransformResult {
    const changes: any[] = []

    // Quick check if this is the Radio component
    if (!content.includes('Radio') || !content.includes("color = 'dark/zinc'")) {
      return {
        content,
        changes: [],
        hasChanges: false,
      }
    }

    try {
      const jscodeshift = require('jscodeshift')
      const j = jscodeshift.withParser('tsx')

      const transformer = (fileInfo: FileInfo, _api: API) => {
        const root = j(fileInfo.source)

        // Helper function to update color defaults in parameters
        const updateColorDefault = (params: any[]) => {
          if (params && params.length > 0 && params[0].type === 'ObjectPattern') {
            const properties = params[0].properties

            properties.forEach((prop: any) => {
              if (
                (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
                prop.key.name === 'color' &&
                prop.value.type === 'AssignmentPattern' &&
                prop.value.right.value === 'dark/zinc'
              ) {
                // Update the default value
                prop.value.right.value = 'primary'

                changes.push({
                  type: 'default-value',
                  description: 'Updated default color from dark/zinc to primary',
                  oldValue: 'dark/zinc',
                  newValue: 'primary',
                })
              }
            })
          }
        }

        // Find the Radio function declaration
        root
          .find(j.FunctionDeclaration, {
            id: { name: 'Radio' },
          })
          .forEach((path: any) => {
            updateColorDefault(path.value.params)
          })

        // Also check for exported function expressions
        root
          .find(j.VariableDeclarator, {
            id: { name: 'Radio' },
          })
          .forEach((path: any) => {
            if (
              path.value.init &&
              (path.value.init.type === 'FunctionExpression' ||
                path.value.init.type === 'ArrowFunctionExpression')
            ) {
              updateColorDefault(path.value.init.params)
            }
          })

        return root.toSource(STANDARD_AST_FORMAT_OPTIONS)
      }

      const result = transformer(
        { path: 'radio.tsx', source: content },
        { jscodeshift: j, j, stats: () => {}, report: () => {} }
      )

      return {
        content: result || content,
        changes,
        hasChanges: changes.length > 0,
      }
    } catch (error) {
      console.error('Error in Radio default color transform:', error)
      return {
        content,
        changes: [
          {
            type: 'error',
            description: `Transform failed: ${error}`,
          },
        ],
        hasChanges: false,
      }
    }
  },
}
