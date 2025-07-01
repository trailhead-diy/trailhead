/**
 * Transform to update Button component default color from 'dark/zinc' to 'primary'
 *
 * This transform specifically targets the default value in the Button component
 * and updates it to use the semantic 'primary' token instead of the hardcoded 'dark/zinc' value.
 */

import { API, FileInfo } from 'jscodeshift'
import { STANDARD_AST_FORMAT_OPTIONS } from '@/transforms/components/common/formatting/ast-options.js'
import type { Transform, TransformResult } from '@/transforms/shared/types.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/**
 * Update Button default color transform
 */
export const buttonDefaultColorTransform: Transform = {
  name: 'button-default-color-update',
  description: 'Update Button component default color from dark/zinc to primary',
  type: 'ast',

  execute(content: string): TransformResult {
    const changes: any[] = []

    // Quick check if this is the Button component
    if (!content.includes('Button') || !content.includes("color ?? 'dark/zinc'")) {
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

        // Find the specific pattern: color ?? 'dark/zinc'
        root
          .find(j.LogicalExpression, {
            operator: '??',
            left: { name: 'color' },
            right: { value: 'dark/zinc' },
          })
          .forEach((path: any) => {
            // Replace 'dark/zinc' with 'primary'
            j(path.get('right')).replaceWith(j.literal('primary'))

            changes.push({
              type: 'default-value',
              description: 'Updated default color from dark/zinc to primary',
              oldValue: 'dark/zinc',
              newValue: 'primary',
            })
          })

        return root.toSource(STANDARD_AST_FORMAT_OPTIONS)
      }

      const result = transformer(
        { path: 'button.tsx', source: content },
        { jscodeshift: j, j, stats: () => {}, report: () => {} }
      )

      return {
        content: result || content,
        changes,
        hasChanges: changes.length > 0,
      }
    } catch (error) {
      console.error('Error in Button default color transform:', error)
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
