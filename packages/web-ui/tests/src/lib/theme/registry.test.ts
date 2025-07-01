import { describe, it, expect, vi } from 'vitest'
import {
  createThemeMap,
  addTheme,
  getTheme,
  getThemeNames,
  applyThemeToDocument,
} from '../../../../src/components/theme/registry'
import { createTheme } from '../../../../src/components/theme/builder'

describe('Functional Theme Registry', () => {
  describe('createThemeMap', () => {
    it('should create a map with all preset themes', () => {
      const themes = createThemeMap()

      // Should include all preset themes
      expect(getTheme(themes, 'catalyst')).toBeDefined()
      expect(getTheme(themes, 'red')).toBeDefined()
      expect(getTheme(themes, 'green')).toBeDefined()
      expect(getTheme(themes, 'blue')).toBeDefined()

      // Should have multiple themes available
      expect(themes.size).toBeGreaterThanOrEqual(8)
    })
  })

  describe('addTheme', () => {
    it('should add a theme to the map without mutating original', () => {
      const originalThemes = createThemeMap()
      const originalSize = originalThemes.size

      // Create a complete custom theme
      const customTheme = createTheme('test-theme')
        .withPrimaryColor('oklch(0.6 0.2 250)')
        .withSecondaryColor('oklch(0.7 0.1 200)')
        .withAccentColor('oklch(0.8 0.05 150)')
        .withMutedColor('oklch(0.9 0.02 100)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withBorderColors('oklch(0.9 0.01 0)', 'oklch(0.2 0 0 / 0.1)')
        .build()

      // Add theme
      const newThemes = addTheme(originalThemes, 'test-custom', customTheme)

      // Original should be unchanged
      expect(originalThemes.size).toBe(originalSize)
      expect(getTheme(originalThemes, 'test-custom')).toBeUndefined()

      // New map should have the theme
      expect(newThemes.size).toBe(originalSize + 1)
      expect(getTheme(newThemes, 'test-custom')).toBeDefined()
      expect(getTheme(newThemes, 'test-custom')?.name).toBe('test-theme')
    })

    it('should validate themes before adding', () => {
      const themes = createThemeMap()
      const invalidTheme = {
        name: 'Invalid',
        light: { primary: 'not-a-color' },
        dark: { primary: 'also-not-a-color' },
      }

      // Should throw on invalid theme
      expect(() => {
        addTheme(themes, 'invalid', invalidTheme as any)
      }).toThrow('Invalid theme configuration')
    })
  })

  describe('getTheme', () => {
    it('should retrieve themes from the map', () => {
      const themes = createThemeMap()

      const catalyst = getTheme(themes, 'catalyst')
      expect(catalyst).toBeDefined()
      expect(catalyst?.name).toBe('Catalyst')

      const nonExistent = getTheme(themes, 'non-existent')
      expect(nonExistent).toBeUndefined()
    })
  })

  describe('getThemeNames', () => {
    it('should return all theme names as an array', () => {
      const themes = createThemeMap()
      const names = getThemeNames(themes)

      expect(Array.isArray(names)).toBe(true)
      expect(names).toContain('catalyst')
      expect(names).toContain('red')
      expect(names).toContain('green')
      expect(names.length).toBe(themes.size)
    })
  })

  describe('applyThemeToDocument', () => {
    it('should apply theme CSS variables to document', () => {
      const themes = createThemeMap()

      // Should not throw for valid theme
      expect(() => {
        applyThemeToDocument(themes, 'zinc', false)
      }).not.toThrow()
    })

    it('should handle non-existent themes gracefully', () => {
      const themes = createThemeMap()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      applyThemeToDocument(themes, 'non-existent-theme', false)

      expect(consoleSpy).toHaveBeenCalledWith('Theme "non-existent-theme" is not registered')
      consoleSpy.mockRestore()
    })
  })
})
