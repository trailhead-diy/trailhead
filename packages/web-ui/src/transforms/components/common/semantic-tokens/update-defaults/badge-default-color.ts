/**
 * Transform to update Badge component default color from 'zinc' to 'primary'
 *
 * This transform specifically targets the default value in the Badge component
 * and updates it to use the semantic 'primary' token instead of the hardcoded 'zinc' value.
 */

import { API, FileInfo } from 'jscodeshift'
import { STANDARD_AST_FORMAT_OPTIONS } from '@/transforms/components/common/formatting/ast-options.js'
import type { Transform, TransformResult } from '@/transforms/shared/types.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/**
 * Update Badge default color transform
 */
export const badgeDefaultColorTransform: Transform = {
  name: 'badge-default-color-update',
  description: 'Update Badge component default color from zinc to primary',
  type: 'ast',

  execute(content: string): TransformResult {
    const changes: any[] = []

    // Quick check if this is the Badge component
    if (!content.includes('Badge') || !content.includes("color = 'zinc'")) {
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
        const updateColorDefault = (params: any[], componentName: string) => {
          if (params && params.length > 0 && params[0].type === 'ObjectPattern') {
            const properties = params[0].properties

            properties.forEach((prop: any) => {
              if (
                (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
                prop.key.name === 'color' &&
                prop.value.type === 'AssignmentPattern' &&
                prop.value.right.value === 'zinc'
              ) {
                // Update the default value
                prop.value.right.value = 'primary'

                changes.push({
                  type: 'default-value',
                  description: `Updated ${componentName} default color from zinc to primary`,
                  oldValue: 'zinc',
                  newValue: 'primary',
                })
              }
            })
          }
        }

        // Find the Badge function declaration
        root
          .find(j.FunctionDeclaration, {
            id: { name: 'Badge' },
          })
          .forEach((path: any) => {
            updateColorDefault(path.value.params, 'Badge')
          })

        // Also check for exported function expressions
        root
          .find(j.VariableDeclarator, {
            id: { name: 'Badge' },
          })
          .forEach((path: any) => {
            if (
              path.value.init &&
              (path.value.init.type === 'FunctionExpression' ||
                path.value.init.type === 'ArrowFunctionExpression')
            ) {
              updateColorDefault(path.value.init.params, 'Badge')
            }
          })

        // Handle forwardRef pattern for BadgeButton
        root
          .find(j.CallExpression, {
            callee: { name: 'forwardRef' },
          })
          .forEach((path: any) => {
            const args = path.value.arguments
            if (
              args.length > 0 &&
              (args[0].type === 'FunctionExpression' ||
                args[0].type === 'ArrowFunctionExpression') &&
              args[0].id &&
              args[0].id.name === 'BadgeButton'
            ) {
              updateColorDefault(args[0].params, 'BadgeButton')
            }
          })

        return root.toSource(STANDARD_AST_FORMAT_OPTIONS)
      }

      const result = transformer(
        { path: 'badge.tsx', source: content },
        { jscodeshift: j, j, stats: () => {}, report: () => {} }
      )

      return {
        content: result || content,
        changes,
        hasChanges: changes.length > 0,
      }
    } catch (error) {
      console.error('Error in Badge default color transform:', error)
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
