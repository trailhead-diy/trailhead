/**
 * Transform clsx imports to cn imports
 * Replaces `import clsx from 'clsx'` with `import { cn } from '../utils/cn'`
 */

import { createASTTransform } from '../utilities/ast-transform-factory.js'
import type { JSCodeshift, Collection } from 'jscodeshift'

/**
 * Transform imports and function calls from clsx to cn
 */
function transformClsxToCn(root: Collection<any>, j: JSCodeshift) {
  const changes: any[] = []
  let needsCnImport = false

  // First, remove ALL existing cn imports regardless of path
  root.find(j.ImportDeclaration).forEach((path) => {
    const source = path.node.source.value
    const specifiers = path.node.specifiers || []

    // Check if this import contains cn
    const hasCn = specifiers.some(
      (spec) =>
        spec.type === 'ImportSpecifier' &&
        spec.imported.type === 'Identifier' &&
        spec.imported.name === 'cn'
    )

    if (hasCn) {
      // If this import only has cn, remove the entire import
      if (specifiers.length === 1) {
        j(path).remove()
      } else {
        // Otherwise, just remove the cn specifier
        path.node.specifiers = specifiers.filter(
          (spec) =>
            !(
              spec.type === 'ImportSpecifier' &&
              spec.imported.type === 'Identifier' &&
              spec.imported.name === 'cn'
            )
        )
      }
      changes.push({
        type: 'import',
        description: 'Removed existing cn import',
      })
    }

    // Remove clsx imports
    if (source === 'clsx') {
      needsCnImport = true
      j(path).remove()
      changes.push({
        type: 'import',
        description: 'Removed clsx import',
      })
    }
  })

  // Transform clsx() calls to cn() calls
  root
    .find(j.CallExpression, {
      callee: { type: 'Identifier', name: 'clsx' },
    })
    .forEach((path) => {
      needsCnImport = true
      path.node.callee = j.identifier('cn')
      changes.push({
        type: 'function-call',
        description: 'Converted clsx() call to cn()',
      })
    })

  // Check if cn is used in the file
  root
    .find(j.CallExpression, {
      callee: { type: 'Identifier', name: 'cn' },
    })
    .forEach(() => {
      needsCnImport = true
    })

  // Check if cn will be used after wrapping static classNames
  root
    .find(j.JSXAttribute, {
      name: { type: 'JSXIdentifier', name: 'className' },
    })
    .forEach((path) => {
      const value = path.node.value
      // If there's a string literal className, we'll wrap it with cn()
      if (value?.type === 'StringLiteral' || value?.type === 'Literal') {
        needsCnImport = true
      }
    })

  // Add cn import if needed
  if (needsCnImport) {
    // Find the best place to insert the import
    const existingImports = root.find(j.ImportDeclaration)
    const lastImport = existingImports.at(-1)

    const cnImport = j.importDeclaration(
      [j.importSpecifier(j.identifier('cn'))],
      j.stringLiteral('../utils/cn')
    )

    if (lastImport.length > 0) {
      // Add after the last import
      lastImport.insertAfter(cnImport)
    } else {
      // Check for 'use client' directive
      const program = root.find(j.Program).at(0)
      const firstNode = program.get('body', 0)

      if (
        firstNode &&
        firstNode.node.type === 'ExpressionStatement' &&
        firstNode.node.expression.type === 'Literal' &&
        (firstNode.node.expression.value === 'use client' ||
          firstNode.node.expression.value === 'use server')
      ) {
        // Insert after 'use client'/'use server'
        j(firstNode).insertAfter(cnImport)
      } else {
        // Insert at the beginning
        program.get('body').unshift(cnImport)
      }
    }

    changes.push({
      type: 'import',
      description: 'Added cn import from utils',
    })
  }

  return changes
}

/**
 * clsx to cn import transform
 * Created using AST transform factory for DRY implementation
 */
export const clsxToCnTransform = createASTTransform({
  name: 'clsx-to-cn',
  description: 'Convert clsx imports to cn utility',
  transform: (root, j) => transformClsxToCn(root, j),
})
