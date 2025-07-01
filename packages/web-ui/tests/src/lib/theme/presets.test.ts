import { describe, it, expect } from 'vitest'
import { themePresets, getPresetTheme, generateAllPresetThemes } from '../../../../src/components/theme/presets'
import { createThemeMap, applyThemeToDocument, getTheme } from '../../../../src/components/theme/registry'
import { parseOKLCHColor } from '../../../../src/components/theme/utils'

describe('theme-presets', () => {
  describe('Theme Preset Business Logic', () => {
    it('should provide unique visual identities for each theme', () => {
      const catalyst = themePresets.catalyst()
      const green = themePresets.green()
      const red = themePresets.red()

      // Each theme should have distinct primary colors
      expect(catalyst.light.primary).not.toBe(green.light.primary)
      expect(green.light.primary).not.toBe(red.light.primary)
      expect(red.light.primary).not.toBe(catalyst.light.primary)

      // Verify colors are actually different visually (hue difference)
      const catalystHue = parseOKLCHColor(catalyst.light.primary).h ?? 0
      const greenHue = parseOKLCHColor(green.light.primary).h ?? 0
      const redHue = parseOKLCHColor(red.light.primary).h ?? 0

      expect(Math.abs(catalystHue - greenHue)).toBeGreaterThan(30)
      expect(Math.abs(greenHue - redHue)).toBeGreaterThan(30)
    })

    it('should maintain theme identity between light and dark modes', () => {
      const themes = ['red', 'green', 'blue', 'violet']

      themes.forEach((themeName) => {
        const theme = getPresetTheme(themeName as keyof typeof themePresets)

        // Theme identity should be preserved through hue
        const lightHue = parseOKLCHColor(theme.light.primary).h ?? 0
        const darkHue = parseOKLCHColor(theme.dark.primary).h ?? 0

        // Hues should be similar (within 15 degrees for the same color family)
        const hueDifference = Math.abs(lightHue - darkHue)
        const normalizedDifference = hueDifference > 180 ? 360 - hueDifference : hueDifference

        expect(normalizedDifference).toBeLessThan(15)
      })
    })

    it('should handle OKLCH opacity values correctly', () => {
      const theme = getPresetTheme('red')

      // Border colors use opacity syntax
      expect(theme.dark.border).toMatch(/oklch\(.* \/ 0\.\d+\)/)

      // Should parse correctly
      expect(() => parseOKLCHColor(theme.dark.border)).not.toThrow()
    })
  })

  describe('Theme Application and User Experience', () => {
    it('should apply themes without errors', () => {
      const themes = ['catalyst', 'red', 'green', 'blue', 'violet']
      const themeMap = createThemeMap()

      // Each theme should be retrievable and valid
      themes.forEach((themeName) => {
        expect(() => {
          const theme = getPresetTheme(themeName as keyof typeof themePresets)
          expect(theme).toBeDefined()
          expect(theme.name).toBeTruthy()

          // Verify theme exists in map and can be applied
          const registeredTheme = getTheme(themeMap, themeName)
          expect(registeredTheme).toBeDefined()

          // Verify theme can be applied to document
          applyThemeToDocument(themeMap, themeName, false)
        }).not.toThrow()
      })
    })

    it('should generate usable CSS for all themes', () => {
      const allThemes = generateAllPresetThemes()

      // Should have multiple themes available
      expect(Object.keys(allThemes).length).toBeGreaterThan(5)

      // Each theme should be ready for CSS generation
      Object.entries(allThemes).forEach(([_name, theme]) => {
        expect(theme.name).toBeTruthy()
        expect(theme.light.background).toBeTruthy()
        expect(theme.dark.background).toBeTruthy()
      })
    })

    it('should handle theme not found errors gracefully', () => {
      // This is important for user experience
      expect(() => getPresetTheme('nonexistent' as any)).toThrow(
        'Theme preset "nonexistent" not found'
      )
    })
  })

  describe('Theme Preset Integrity', () => {
    it('should maintain sidebar color consistency', () => {
      const themesWithSidebar = ['catalyst', 'red', 'green', 'blue']

      themesWithSidebar.forEach((themeName) => {
        const theme = getPresetTheme(themeName as keyof typeof themePresets)

        // Sidebar should have proper foreground/background pairs
        if (theme.light.sidebar) {
          expect(theme.light['sidebar-foreground']).toBeTruthy()
        }
        if (theme.dark.sidebar) {
          expect(theme.dark['sidebar-foreground']).toBeTruthy()
        }
      })
    })

    it('should provide complete color palettes for charts', () => {
      const theme = getPresetTheme('catalyst')

      // All 5 chart colors should be defined
      for (let i = 1; i <= 5; i++) {
        const chartKey = `chart-${i}` as keyof typeof theme.light
        expect(theme.light[chartKey]).toBeTruthy()
        expect(theme.dark[chartKey]).toBeTruthy()
      }
    })
  })
})
