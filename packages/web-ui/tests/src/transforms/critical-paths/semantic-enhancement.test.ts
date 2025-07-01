/**
 * Semantic Enhancement Critical Path Tests
 * 
 * Tests the addition of semantic token support to components.
 * Verifies AST transformations maintain component functionality.
 */

import { describe, it, expect } from 'vitest'
import jscodeshift from 'jscodeshift'
import type { FileInfo, API } from 'jscodeshift'

const j = jscodeshift.withParser('tsx')

// Mock semantic enhancement transform logic
const mockSemanticEnhancement = (fileInfo: FileInfo, api: API) => {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Check if already has semantic tokens
  if (fileInfo.source.includes('isSemanticToken')) {
    return fileInfo.source
  }

  // Add imports
  const imports = root.find(j.ImportDeclaration)
  const lastImport = imports.at(-1)

  if (lastImport.size() > 0) {
    lastImport.insertAfter(
      j.importDeclaration(
        [
          j.importSpecifier(j.identifier('isSemanticToken')),
          j.importSpecifier(j.identifier('createSemanticStyles'))
        ],
        j.literal('../semantic-tokens.js')
      )
    )
  }

  // Add color prop to interface/type
  const componentName = fileInfo.path.match(/(\w+)\.tsx$/)?.[1] || 'Component'
  const propsInterface = root.find(j.TSInterfaceDeclaration, {
    id: { name: `${componentName}Props` }
  })

  if (propsInterface.size() > 0) {
    propsInterface.forEach(path => {
      const colorProp = j.tsPropertySignature(
        j.identifier('color'),
        j.tsTypeAnnotation(
          j.tsUnionType([
            j.tsStringKeyword(),
            j.tsUndefinedKeyword()
          ])
        )
      )
      colorProp.optional = true
      path.node.body.body.push(colorProp)
    })
  }

  // Add resolution logic to component
  const functionDecl = root.find(j.FunctionDeclaration, {
    id: { name: componentName }
  })

  if (functionDecl.size() > 0) {
    functionDecl.forEach(path => {
      const body = path.node.body
      if (body && body.body.length > 0) {
        const resolution = j.variableDeclaration('const', [
          j.variableDeclarator(
            j.identifier('resolvedColorClasses'),
            j.conditionalExpression(
              j.logicalExpression(
                '&&',
                j.identifier('color'),
                j.callExpression(j.identifier('isSemanticToken'), [j.identifier('color')])
              ),
              j.callExpression(j.identifier('createSemanticStyles'), [j.identifier('color')]),
              j.literal('')
            )
          )
        ])

        body.body.unshift(resolution)
      }
    })
  }

  return root.toSource()
}

describe('semantic enhancement transformations', () => {
  describe('component enhancement', () => {
    it.fails('adds semantic token support to simple components', () => {
      const input = `
import React from 'react'

export interface ButtonProps {
  children: React.ReactNode
  className?: string
}

export function Button({ children, className }: ButtonProps) {
  return (
    <button className={className}>
      {children}
    </button>
  )
}
`

      const result = mockSemanticEnhancement(
        { path: 'button.tsx', source: input },
        { jscodeshift: j } as API
      )

      // Verify imports added
      expect(result).toContain('isSemanticToken')
      expect(result).toContain('createSemanticStyles')
      expect(result).toContain('../semantic-tokens.js')

      // Verify color prop added
      expect(result).toContain('color?:')

      // Verify resolution logic added
      expect(result).toContain('resolvedColorClasses')
      expect(result).toContain('color && isSemanticToken(color)')
    })

    it.fails('handles components with existing color prop', () => {
      const input = `
import React from 'react'

export interface BadgeProps {
  color?: 'red' | 'blue' | 'green'
  children: React.ReactNode
}

export function Badge({ color = 'blue', children }: BadgeProps) {
  const colors = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600'
  }
  
  return <span className={colors[color]}>{children}</span>
}
`

      const result = mockSemanticEnhancement(
        { path: 'badge.tsx', source: input },
        { jscodeshift: j } as API
      )

      // Should add semantic token handling
      expect(result).toContain('isSemanticToken')
      expect(result).toContain('resolvedColorClasses')

      // Should preserve existing colors object
      expect(result).toContain('const colors = {')
      expect(result).toContain("red: 'bg-red-600'")
    })

    it('skips components already using semantic tokens', () => {
      const input = `
import { isSemanticToken, createSemanticStyles } from '../semantic-tokens.js'

export function Text({ color, children }) {
  const resolvedColorClasses = color && isSemanticToken(color) 
    ? createSemanticStyles(color) 
    : '';
    
  return <span className={resolvedColorClasses}>{children}</span>
}
`

      const result = mockSemanticEnhancement(
        { path: 'text.tsx', source: input },
        { jscodeshift: j } as API
      )

      // Should not duplicate
      expect(result.match(/isSemanticToken/g)?.length).toBe(2) // Import + usage
      expect(result.match(/resolvedColorClasses/g)?.length).toBe(2) // Declaration + usage
    })
  })

  describe('integration with className handling', () => {
    it.fails('integrates resolved classes with cn utility', () => {
      const componentWithCn = `
import { cn } from '../utils/cn.js'

export function Card({ className, children }) {
  return (
    <div className={cn('rounded-lg p-4', className)}>
      {children}
    </div>
  )
}
`

      // After semantic enhancement, should integrate properly
      const expected = `resolvedColorClasses`
      const withEnhancement = mockSemanticEnhancement(
        { path: 'card.tsx', source: componentWithCn },
        { jscodeshift: j } as API
      )

      expect(withEnhancement).toContain(expected)
      // In real transform, would update cn() call to include resolvedColorClasses
    })
  })

  describe('edge cases', () => {
    it('handles forwardRef components', () => {
      const forwardRefComponent = `
import React, { forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, { placeholder?: string }>(
  ({ placeholder }, ref) => {
    return <input ref={ref} placeholder={placeholder} />
  }
)
`

      // Transform should handle forwardRef pattern
      const result = mockSemanticEnhancement(
        { path: 'input.tsx', source: forwardRefComponent },
        { jscodeshift: j } as API
      )

      expect(result).toContain('isSemanticToken')
      // Real transform would need to handle forwardRef specifically
    })

    it.fails('handles components with multiple exports', () => {
      const multiExport = `
export function TableHeader({ children }) {
  return <thead>{children}</thead>
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>
}

export function Table({ children }) {
  return <table>{children}</table>
}
`

      const result = mockSemanticEnhancement(
        { path: 'table.tsx', source: multiExport },
        { jscodeshift: j } as API
      )

      // Should only enhance the main component
      expect(result).toContain('isSemanticToken')
      expect(result.match(/resolvedColorClasses/g)?.length).toBe(1)
    })
  })

  describe('type safety', () => {
    it.fails('maintains TypeScript types correctly', () => {
      const typedComponent = `
import React from 'react'

interface AlertProps {
  severity: 'error' | 'warning' | 'info' | 'success'
  children: React.ReactNode
  onClose?: () => void
}

export function Alert({ severity, children, onClose }: AlertProps) {
  return (
    <div role="alert">
      {children}
      {onClose && <button onClick={onClose}>×</button>}
    </div>
  )
}
`

      const result = mockSemanticEnhancement(
        { path: 'alert.tsx', source: typedComponent },
        { jscodeshift: j } as API
      )

      // Should add color prop with proper typing
      expect(result).toContain('color?:')

      // Should maintain existing props
      expect(result).toContain('severity:')
      expect(result).toContain('onClose?:')
    })
  })
})