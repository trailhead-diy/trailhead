import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateTheme, applyTheme, generateThemeCSS, createCustomTheme } from '../../../../src/components/theme/config'
import { getPresetTheme } from '../../../../src/components/theme/presets'
import type { TrailheadThemeConfig } from '../../../../src/components/theme/config'

describe('theme-config', () => {
  describe('Theme Validation', () => {
    it('should validate preset themes for production use', () => {
      // Test core preset themes
      const themes = ['catalyst', 'red', 'green', 'blue']

      themes.forEach((name) => {
        const theme = getPresetTheme(name as any)
        const result = validateTheme(theme)
        expect(result.isValid).toBe(true)

        if (!result.isValid) {
          console.error(`Theme ${name} validation failed:`, result.errors)
        }
      })
    })

    it('should catch incomplete themes', () => {
      const incompleteTheme = {
        name: 'Incomplete',
        light: { primary: 'oklch(0.7 0.2 250)' },
        dark: { primary: 'oklch(0.7 0.2 250)' },
      } as TrailheadThemeConfig

      const result = validateTheme(incompleteTheme)
      // Should fail validation for missing required colors
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate custom themes with overrides', () => {
      const baseTheme = getPresetTheme('catalyst')
      const customTheme = createCustomTheme(baseTheme, {
        name: 'Custom',
        light: {
          ...baseTheme.light,
          primary: 'oklch(0.5 0.3 120)',
        },
        dark: {
          ...baseTheme.dark,
          primary: 'oklch(0.6 0.3 120)',
        },
      })

      const result = validateTheme(customTheme)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Theme CSS Generation', () => {
    it('should generate valid CSS with required selectors', () => {
      const theme = getPresetTheme('catalyst')
      const css = generateThemeCSS(theme, { includeDarkMode: false })
      // Test that CSS is generated, not specific values
      expect(css).toBeTruthy()
      expect(css.length).toBeGreaterThan(100)
      expect(css).toContain(':root')
      expect(css).toContain('--background:')
      expect(css).toContain('--primary:')
    })

    it('should include dark mode when requested', () => {
      const theme = getPresetTheme('catalyst')
      const cssWithDark = generateThemeCSS(theme, { includeDarkMode: true })
      const cssWithoutDark = generateThemeCSS(theme, { includeDarkMode: false })

      // Dark mode CSS should be longer and contain dark selector
      expect(cssWithDark.length).toBeGreaterThan(cssWithoutDark.length)
      expect(cssWithDark).toContain('.dark')
      expect(cssWithoutDark).not.toContain('.dark')
    })
  })

  describe('createCustomTheme', () => {
    it('should create a custom theme', () => {
      const baseTheme = getPresetTheme('catalyst')
      const theme = createCustomTheme(baseTheme, {
        name: 'Test',
        light: {
          ...baseTheme.light,
          primary: 'oklch(0.5 0.3 120)',
        },
        dark: {
          ...baseTheme.dark,
          primary: 'oklch(0.6 0.3 120)',
        },
      })

      expect(theme.name).toBe('Test')
      expect(theme.light.primary).toBe('oklch(0.5 0.3 120)')
      expect(theme.dark.primary).toBe('oklch(0.6 0.3 120)')
    })
  })

  describe('applyTheme', () => {
    let documentStyle: CSSStyleDeclaration

    beforeEach(() => {
      // Mock document.documentElement.style
      documentStyle = {
        setProperty: vi.fn(),
        removeProperty: vi.fn(),
      } as any

      Object.defineProperty(document.documentElement, 'style', {
        value: documentStyle,
        writable: true,
      })
    })

    it('should apply theme colors to document', () => {
      const theme = getPresetTheme('catalyst')
      applyTheme(theme, false)

      expect(documentStyle.setProperty).toHaveBeenCalledWith('--background', theme.light.background)
      expect(documentStyle.setProperty).toHaveBeenCalledWith('--foreground', theme.light.foreground)
    })

    it('should handle SSR environment', () => {
      const originalDocument = global.document
      // @ts-ignore
      global.document = undefined

      const theme = getPresetTheme('catalyst')
      // Should not throw
      expect(() => applyTheme(theme, false)).not.toThrow()

      global.document = originalDocument
    })
  })
})
