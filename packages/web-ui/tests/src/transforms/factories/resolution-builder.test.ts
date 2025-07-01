/**
 * Resolution Builder Tests
 * 
 * Tests the modular AST pattern building system for semantic token resolution.
 * Testing behavior, not implementation.
 */

import { describe, it, expect } from 'vitest'
import jscodeshift from 'jscodeshift'
import { buildSemanticResolution } from '../../../../src/transforms/components/common/semantic-tokens/utilities/resolution-builder/ast-builders.js'
import { insertSemanticResolution, checkVariableExists } from '../../../../src/transforms/components/common/semantic-tokens/utilities/resolution-builder/insertion-logic.js'
import * as builders from '../../../../src/transforms/components/common/semantic-tokens/utilities/resolution-builder/ast-builders.js'

const j = jscodeshift.withParser('tsx')

describe('resolution builder system', () => {
  describe('buildSemanticResolution', () => {
    it.fails('builds IIFE pattern for immediate resolution', () => {
      const config = {
        componentName: 'Button',
        variableName: 'resolvedColorClasses',
        defaultColor: 'dark',
        useIIFE: true,
        hasColorsObject: true
      }

      const ast = buildSemanticResolution(j, config)
      const code = j(ast).toSource()

      expect(code).toContain('const resolvedColorClasses = (() => {')
      expect(code).toContain('if (!color || !isSemanticToken(color)) return')
      expect(code).toContain('return createSemanticButtonStyles(color)')
      expect(code).toContain('})()')
    })

    it.fails('builds conditional pattern for ternary expressions', () => {
      const config = {
        componentName: 'Badge',
        variableName: 'resolvedColorClasses',
        defaultColor: 'zinc',
        useIIFE: false,
        hasColorsObject: true
      }

      const ast = buildSemanticResolution(j, config)
      const code = j(ast).toSource()

      expect(code).toContain('const resolvedColorClasses = color && isSemanticToken(color)')
      expect(code).toContain('? createSemanticBadgeStyles(color)')
      expect(code).toContain(': ""')
    })

    it('builds simple conditional pattern without colors object', () => {
      const config = {
        componentName: 'Text',
        variableName: 'resolvedColorClasses',
        defaultColor: 'zinc',
        useIIFE: false,
        hasColorsObject: false
      }

      const ast = buildSemanticResolution(j, config)
      const code = j(ast).toSource()

      expect(code).toContain('const resolvedColorClasses = color && isSemanticToken(color)')
      expect(code).toContain('? createSemanticTextStyles(color)')
      expect(code).not.toContain('colors[color]')
    })
  })

  describe('pattern builders', () => {
    it.fails('withIIFEAndColors creates proper IIFE with colors check', () => {
      const pattern = builders.withIIFEAndColors(j, {
        componentName: 'Switch',
        variableName: 'resolvedStyles',
        defaultColor: 'dark/zinc'
      })

      const code = j(pattern).toSource()

      expect(code).toContain('(() => {')
      expect(code).toContain('if (!color || !isSemanticToken(color)) return colors[color] || ""')
      expect(code).toContain('return createSemanticSwitchStyles(color)')
    })

    it.fails('withConditionalAndColors creates ternary with colors fallback', () => {
      const pattern = builders.withConditionalAndColors(j, {
        componentName: 'Radio',
        variableName: 'colorClasses'
      })

      const code = j(pattern).toSource()

      expect(code).toContain('color && isSemanticToken(color)')
      expect(code).toContain('? createSemanticRadioStyles(color)')
      expect(code).toContain(': colors[color] || ""')
    })

    it('withSimpleConditional creates basic ternary pattern', () => {
      const pattern = builders.withSimpleConditional(j, {
        componentName: 'Link',
        variableName: 'linkStyles'
      })

      const code = j(pattern).toSource()

      expect(code).toContain('color && isSemanticToken(color)')
      expect(code).toContain('? createSemanticLinkStyles(color)')
      expect(code).toContain(': ""')
      expect(code).not.toContain('colors[color]')
    })
  })

  describe('insertSemanticResolution', () => {
    it.fails('inserts resolution at the beginning of function body', () => {
      const functionCode = `
function TestComponent({ color }: { color?: string }) {
  const existingVar = 'test';
  return <div />;
}
`
      const ast = j(functionCode)
      const functionBody = ast.find(j.FunctionDeclaration).at(0).get('body')

      const resolution = j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('resolvedColorClasses'),
          j.literal('test-value')
        )
      ])

      const inserted = insertSemanticResolution(j, functionBody, resolution)

      expect(inserted).toBe(true)

      const result = ast.toSource()
      expect(result).toContain('const resolvedColorClasses = "test-value"')
      // Should be before existingVar
      const resolvedIndex = result.indexOf('resolvedColorClasses')
      const existingIndex = result.indexOf('existingVar')
      expect(resolvedIndex).toBeLessThan(existingIndex)
    })
  })

  describe('checkVariableExists', () => {
    it('detects existing resolution variables', () => {
      const codeWithResolution = `
function Component() {
  const resolvedColorClasses = color ? 'test' : '';
  return <div />;
}
`
      const ast = j(codeWithResolution)
      const functionBody = ast.find(j.FunctionDeclaration).at(0).get('body')
      const exists = checkVariableExists(j, functionBody, 'resolvedColorClasses')
      expect(exists).toBe(true)
    })

    it('returns false when resolution does not exist', () => {
      const codeWithoutResolution = `
function Component() {
  const otherVar = 'test';
  return <div />;
}
`
      const ast = j(codeWithoutResolution)
      const functionBody = ast.find(j.FunctionDeclaration).at(0).get('body')
      const exists = checkVariableExists(j, functionBody, 'resolvedColorClasses')
      expect(exists).toBe(false)
    })
  })

  describe('real-world component patterns', () => {
    it('handles Switch component with complex colors object', () => {
      const switchComponent = `
export function Switch({ color = 'dark/zinc' }: { color?: Color }) {
  const colors = {
    'dark/zinc': [
      '[--switch-bg:theme(colors.zinc.950)]',
      '[--switch-ring:theme(colors.zinc.950/15)]'
    ]
  }
  
  return <Headless.Switch className={colors[color]} />
}
`
      const ast = j(switchComponent)
      const functionDecl = ast.find(j.FunctionDeclaration, { id: { name: 'Switch' } })

      // Build and insert resolution
      const resolution = buildSemanticResolution(j, {
        componentName: 'Switch',
        variableName: 'resolvedColorClasses',
        defaultColor: 'dark/zinc',
        useIIFE: true,
        hasColorsObject: true
      })

      const body = functionDecl.get('body')
      insertSemanticResolution(j, body, resolution)

      const result = ast.toSource()
      expect(result).toContain('const resolvedColorClasses = (() => {')
      expect(result).toContain('return colors[color]')
    })
  })
})