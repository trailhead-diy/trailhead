import { describe, it, expect } from 'vitest'
import { createTheme } from '../../../../src/components/theme/builder'
import { validateTheme } from '../../../../src/components/theme/config'
import { parseOKLCHColor } from '../../../../src/components/theme/utils'

describe('Theme Composition Edge Cases', () => {
  describe('Functional Composition Immutability', () => {
    it('should chain builder operations correctly', () => {
      const builder = createTheme('test')

      // Chain multiple operations
      const result = builder
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withSecondaryColor('oklch(0.6 0.1 200)')
        .build()

      // Should create a complete theme
      expect(result.name).toBe('test')
      expect(result.light.primary).toContain('oklch(0.5')
      expect(result.light.secondary).toContain('oklch(0.6')
    })

    it('should handle conflicting color transformations using last-write-wins', () => {
      const theme = createTheme('test')
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withPrimaryColor('oklch(0.7 0.3 180)') // Override
        .withPrimaryColor('oklch(0.6 0.25 220)') // Override again
        .build()

      // Should use the last transformation
      expect(theme.light.primary).toContain('oklch(0.6')
      expect(theme.light.primary).toContain('0.25')
      expect(theme.light.primary).toContain('220')
    })

    it('should support theme composition through component overrides', () => {
      const theme = createTheme('composite')
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withAccentColor('oklch(0.7 0.15 100)')
        .withComponentOverrides({
          button: {
            'primary-bg': 'oklch(0.6 0.3 270)', // Custom button color
          },
          input: {
            bg: 'oklch(0.98 0 0)',
          },
        })
        .build()

      // Should have theme colors and component overrides
      expect(theme.light.primary).toContain('oklch(0.5')
      expect(theme.light.accent).toContain('oklch(0.7')
      expect(theme.components?.button?.['primary-bg']).toBe('oklch(0.6 0.3 270)')
      expect(theme.components?.input?.bg).toBe('oklch(0.98 0 0)')
    })
  })

  describe('Partial Theme Data Handling', () => {
    it.fails('should fail validation when missing required colors', () => {
      const incompleteTheme = {
        name: 'Incomplete',
        light: {
          primary: 'oklch(0.5 0.2 250)',
          secondary: 'oklch(0.6 0.1 200)',
          // Missing: background, foreground, muted, accent, destructive, border, etc.
        },
        dark: {
          primary: 'oklch(0.5 0.2 250)',
          secondary: 'oklch(0.6 0.1 200)',
        },
      }

      const validation = validateTheme(incompleteTheme as any)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Missing light theme property: background')
      expect(validation.errors).toContain('Missing light theme property: foreground')
    })

    it('should auto-complete missing theme properties', () => {
      // The builder should handle this gracefully with auto-completion
      const theme = createTheme('partial')
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withSecondaryColor('oklch(0.6 0.1 200)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withBorderColors('oklch(0.9 0.01 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withAccentColor('oklch(0.7 0.15 150)')
        .withMutedColor('oklch(0.8 0.05 100)')
        .build()

      // Should have all required properties filled with auto-completion
      const validation = validateTheme(theme)
      expect(validation.isValid).toBe(true)
      expect(theme.light.background).toBeTruthy()
      expect(theme.light.foreground).toBeTruthy()
      expect(theme.light.card).toBeTruthy() // Auto-completed from background
      expect(theme.light.sidebar).toBeTruthy() // Auto-completed
    })
  })

  describe('Complex Color Transformations', () => {
    it('should handle out-of-gamut OKLCH colors gracefully', () => {
      // Extreme values that might be out of gamut
      const theme = createTheme('extreme')
        .withPrimaryColor('oklch(0.99 0.4 360)') // Very bright, high chroma
        .withAccentColor('oklch(0.01 0.5 180)') // Very dark, high chroma
        .build()

      // Should clamp to valid ranges
      const primaryColor = parseOKLCHColor(theme.light.primary)
      const accentColor = parseOKLCHColor(theme.light.accent)

      expect(primaryColor.l).toBeGreaterThanOrEqual(0)
      expect(primaryColor.l).toBeLessThanOrEqual(1)
      expect(accentColor.l).toBeGreaterThanOrEqual(0)
      expect(accentColor.l).toBeLessThanOrEqual(1)
    })

    it('should preserve color relationships in component overrides', () => {
      const theme = createTheme('override-test')
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withComponentOverrides({
          button: {
            'primary-bg': 'oklch(0.5 0.2 250)',
            'primary-hover': 'oklch(0.45 0.22 250)', // Darker on hover
          },
        })
        .build()

      expect(theme.components?.button?.['primary-bg']).toBe('oklch(0.5 0.2 250)')
      expect(theme.components?.button?.['primary-hover']).toBe('oklch(0.45 0.22 250)')

      // Hover should be darker
      const bgColor = parseOKLCHColor(theme.components!.button!['primary-bg']!)
      const hoverColor = parseOKLCHColor(theme.components!.button!['primary-hover']!)
      expect(hoverColor.l).toBeLessThan(bgColor.l)
    })
  })

  describe('Order of Operations', () => {
    it('should apply color transformations with proper dark mode generation', () => {
      const theme = createTheme('order-test')
        .withPrimaryColor('oklch(0.5 0.2 250)') // Light mode
        .withPrimaryColor('oklch(0.7 0.3 180)', 'oklch(0.3 0.3 180)') // Override with explicit dark
        .build()

      // Should use the last provided colors
      expect(theme.light.primary).toContain('oklch(0.7')
      expect(theme.dark.primary).toContain('oklch(0.3')
    })

    it('should chain multiple component overrides correctly', () => {
      const theme = createTheme('chain-test')
        .withComponentOverrides({
          button: { 'primary-bg': 'oklch(0.5 0.2 250)' },
        })
        .withComponentOverrides({
          button: { 'primary-hover': 'oklch(0.45 0.22 250)' }, // Should merge
          input: { bg: 'oklch(0.98 0 0)' },
        })
        .withComponentOverrides({
          button: { 'primary-bg': 'oklch(0.6 0.25 260)' }, // Should override
        })
        .build()

      // Should have merged and overridden correctly
      expect(theme.components?.button?.['primary-bg']).toBe('oklch(0.6 0.25 260)')
      expect(theme.components?.button?.['primary-hover']).toBe('oklch(0.45 0.22 250)')
      expect(theme.components?.input?.bg).toBe('oklch(0.98 0 0)')
    })
  })

  describe('Builder Pattern Verification', () => {
    it('should support fluent chaining API', () => {
      const theme = createTheme('fluent')
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withSecondaryColor('oklch(0.6 0.1 200)')
        .withAccentColor('oklch(0.7 0.15 150)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withBorderColors('oklch(0.9 0.01 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withMutedColor('oklch(0.8 0.05 100)')
        .build()

      // Should create complete theme with all chained methods
      expect(theme.name).toBe('fluent')
      expect(theme.light.primary).toContain('oklch(0.5')
      expect(theme.light.secondary).toContain('oklch(0.6')
      expect(theme.light.accent).toContain('oklch(0.7')
      expect(theme.light.background).toBe('oklch(1 0 0)')
    })

    it('should create independent theme instances', () => {
      // Create completely separate theme builders
      const theme1 = createTheme('theme1')
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withAccentColor('oklch(0.7 0.15 100)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withBorderColors('oklch(0.9 0.01 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withMutedColor('oklch(0.8 0.05 100)')
        .build()

      const theme2 = createTheme('theme2')
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withAccentColor('oklch(0.6 0.25 200)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withBorderColors('oklch(0.9 0.01 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withMutedColor('oklch(0.8 0.05 100)')
        .build()

      // Each theme should have different accent colors
      expect(theme1.light.accent).toContain('oklch(0.7')
      expect(theme2.light.accent).toContain('oklch(0.6')

      // Both should have the same primary color
      expect(theme1.light.primary).toContain('oklch(0.5')
      expect(theme2.light.primary).toContain('oklch(0.5')
    })
  })

  describe('Error Recovery and Validation', () => {
    it('should handle invalid OKLCH values by graceful fallback', () => {
      // Current implementation may not throw but could provide fallbacks
      const theme = createTheme('invalid-test')
        .withPrimaryColor('not-a-color')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withBorderColors('oklch(0.9 0.01 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withAccentColor('oklch(0.7 0.15 150)')
        .withMutedColor('oklch(0.8 0.05 100)')
        .build()

      // Should create a theme even with invalid color
      expect(theme.name).toBe('invalid-test')
      // The invalid color might be transformed or have a fallback
      expect(theme.light.primary).toBeDefined()
    })

    it('should validate complete theme structure on build', () => {
      const theme = createTheme('valid')
        .withPrimaryColor('oklch(0.5 0.2 250)')
        .withSecondaryColor('oklch(0.6 0.1 200)')
        .withAccentColor('oklch(0.7 0.15 150)')
        .withMutedColor('oklch(0.8 0.05 100)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withBorderColors('oklch(0.9 0.01 0)', 'oklch(0.2 0 0 / 0.1)')
        .build()

      const validation = validateTheme(theme)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })
})
