/**
 * Colors Object Detector Tests
 * Tests the colors object protection utilities
 */

import { describe, it, expect } from 'vitest'
import {
  isWithinColorsObject,
  isWithinColorsArray,
  isWithinColorsCSSVariable,
  createColorsObjectProtection,
  createColorsProtectedReplacer,
  validateColorsObjectPreservation
} from '../../../../src/transforms/components/common/utilities/colors-object-detector.js'

describe('Colors Object Detector', () => {
  const switchComponentMock = `
export function Switch({ color = 'dark/zinc' }: { color?: Color }) {
  const colors = {
    'dark/zinc': [
      '[--switch-bg-ring:var(--color-foreground)]/90 [--switch-bg:var(--color-foreground)] dark:[--switch-bg-ring:transparent]',
      '[--switch-ring:var(--color-foreground)]/90 [--switch-shadow:var(--color-black)]/10 [--switch:white]',
    ],
    zinc: [
      '[--switch-bg-ring:var(--color-muted-foreground)]/90 [--switch-bg:var(--color-muted-foreground)]',
      '[--switch-shadow:var(--color-black)]/10 [--switch:white] [--switch-ring:var(--color-muted-foreground)]/90',
    ],
    red: [
      '[--switch-bg-ring:var(--color-red-700)]/90 [--switch-bg:var(--color-red-600)]',
      '[--switch:white] [--switch-ring:var(--color-red-700)]/90 [--switch-shadow:var(--color-red-900)]/20',
    ],
  }
  
  return (
    <div className="bg-red-500 text-zinc-900">
      Content outside colors object
    </div>
  )
}`

  describe('isWithinColorsObject', () => {
    it('should detect positions within colors object declaration', () => {
      const pos = switchComponentMock.indexOf('const colors = {') + 'const colors = {'.length + 5 // position inside the colors object
      expect(isWithinColorsObject(switchComponentMock, pos)).toBe(true)
    })

    it('should detect positions within color key definitions', () => {
      const pos = switchComponentMock.indexOf("'dark/zinc':")
      expect(isWithinColorsObject(switchComponentMock, pos + 5)).toBe(true)
    })

    it('should detect positions within CSS variable strings', () => {
      const pos = switchComponentMock.indexOf('var(--color-foreground)')
      expect(isWithinColorsObject(switchComponentMock, pos)).toBe(true)
    })

    it('should not detect positions outside colors object', () => {
      const pos = switchComponentMock.indexOf('bg-red-500')
      expect(isWithinColorsObject(switchComponentMock, pos)).toBe(false)
    })

    it('should not detect positions in function parameters', () => {
      const pos = switchComponentMock.indexOf("color = 'dark/zinc'")
      expect(isWithinColorsObject(switchComponentMock, pos)).toBe(false)
    })
  })

  describe('isWithinColorsArray', () => {
    it('should detect positions within color array elements', () => {
      const pos = switchComponentMock.indexOf('[--switch-bg-ring:var(--color-foreground)]')
      expect(isWithinColorsArray(switchComponentMock, pos)).toBe(true)
    })

    it('should not detect positions outside arrays', () => {
      const pos = switchComponentMock.indexOf('bg-red-500')
      expect(isWithinColorsArray(switchComponentMock, pos)).toBe(false)
    })
  })

  describe('isWithinColorsCSSVariable', () => {
    it('should detect positions within CSS variables in colors', () => {
      const pos = switchComponentMock.indexOf('--color-foreground')
      expect(isWithinColorsCSSVariable(switchComponentMock, pos)).toBe(true)
    })

    it('should not detect regular CSS classes', () => {
      const pos = switchComponentMock.indexOf('bg-red-500')
      expect(isWithinColorsCSSVariable(switchComponentMock, pos)).toBe(false)
    })
  })

  describe('createColorsObjectProtection', () => {
    it('should protect CSS variables in colors objects', () => {
      const protection = createColorsObjectProtection()
      const pos = switchComponentMock.indexOf('var(--color-foreground)')
      const match = Object.assign(['var(--color-foreground)'], { index: pos }) as RegExpMatchArray
      
      expect(protection(switchComponentMock, match)).toBe(true)
    })

    it('should not protect regular content', () => {
      const protection = createColorsObjectProtection()
      const pos = switchComponentMock.indexOf('bg-red-500')
      const match = Object.assign(['bg-red-500'], { index: pos }) as RegExpMatchArray
      
      expect(protection(switchComponentMock, match)).toBe(false)
    })
  })

  describe('createColorsProtectedReplacer', () => {
    it('should protect colors CSS variables from transformation', () => {
      const replacer = createColorsProtectedReplacer(
        /var\(--color-(\w+)\)/g,
        'var(--semantic-$1)'
      )
      
      const result = replacer(switchComponentMock)
      
      // Should not transform CSS variables in colors object
      expect(result).toContain('var(--color-foreground)')
      expect(result).toContain('var(--color-red-700)')
      
      // Should still transform CSS variables outside colors object (if any)
      // In this case, there are none, so content should be unchanged
    })

    it('should allow transformation of non-protected content', () => {
      const replacer = createColorsProtectedReplacer(
        /bg-red-500/g,
        'bg-primary-500'
      )
      
      const result = replacer(switchComponentMock)
      
      // Should transform regular classes outside colors object
      expect(result).toContain('bg-primary-500')
      expect(result).not.toContain('bg-red-500')
    })
  })

  describe('validateColorsObjectPreservation', () => {
    it('should validate preservation of colors CSS variables', () => {
      const original = switchComponentMock
      const preserved = switchComponentMock // No changes
      
      const validation = validateColorsObjectPreservation(original, preserved)
      
      expect(validation.isValid).toBe(true)
      expect(validation.violations).toHaveLength(0)
    })

    it('should detect violations when colors variables are modified', () => {
      const original = switchComponentMock
      const modified = original.replace('var(--color-foreground)', 'var(--semantic-foreground)')
      
      const validation = validateColorsObjectPreservation(original, modified)
      
      expect(validation.isValid).toBe(false)
      expect(validation.violations.length).toBeGreaterThan(0)
      expect(validation.violations[0]).toContain('CSS variable removed or modified')
    })

    it('should detect when colors object is removed', () => {
      const original = switchComponentMock
      const modified = original.replace(/const colors = \{[\s\S]*?\}/g, '')
      
      const validation = validateColorsObjectPreservation(original, modified)
      
      expect(validation.isValid).toBe(false)
      expect(validation.violations).toContain('Colors object declaration was removed or modified')
    })
  })

  describe('Real-world component patterns', () => {
    const buttonComponentMock = `
export function Button({ color = 'dark' }: { color?: Color }) {
  const colors = {
    dark: 'bg-zinc-900 text-white',  
    light: 'bg-white text-zinc-900',
    red: '[--btn-bg:var(--color-red-600)] [--btn-text:white]'
  }
  
  return <button className={cn(colors[color], 'px-4 py-2')}>Click me</button>
}`

    it('should protect simple color strings in colors object', () => {
      const pos = buttonComponentMock.indexOf('bg-zinc-900')
      expect(isWithinColorsObject(buttonComponentMock, pos)).toBe(true)
    })

    it('should protect CSS variables in colors object', () => {
      const pos = buttonComponentMock.indexOf('var(--color-red-600)')
      expect(isWithinColorsObject(buttonComponentMock, pos)).toBe(true)
    })

    it('should not protect className usage outside colors', () => {
      const pos = buttonComponentMock.indexOf('px-4 py-2')
      expect(isWithinColorsObject(buttonComponentMock, pos)).toBe(false)
    })
  })
})