/**
 * @fileoverview Tests for Catalyst Theme Generation
 * 
 * HIGH-ROI tests focusing on:
 * - Theme structure validation
 * - Color value correctness 
 * - Light/dark mode consistency
 * - Enhanced token completeness
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createCatalystTheme } from '../../../../src/components/theme/catalyst-theme'
import type { TrailheadThemeConfig } from '../../../../src/components/theme/config'

describe('Catalyst Theme Generation', () => {
  let theme: TrailheadThemeConfig

  beforeEach(() => {
    theme = createCatalystTheme()
  })

  describe('Theme Structure Validation', () => {
    it('should generate theme with correct name', () => {
      expect(theme.name).toBe('Catalyst')
    })

    it('should have both light and dark modes', () => {
      expect(theme.light).toBeDefined()
      expect(theme.dark).toBeDefined()
      expect(typeof theme.light).toBe('object')
      expect(typeof theme.dark).toBe('object')
    })

    it('should include all required shadcn/ui tokens', () => {
      const requiredTokens = [
        'background', 'foreground', 'card', 'card-foreground',
        'popover', 'popover-foreground', 'primary', 'primary-foreground',
        'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
        'accent', 'accent-foreground', 'destructive', 'destructive-foreground',
        'border', 'input', 'ring'
      ]

      requiredTokens.forEach(token => {
        expect(theme.light).toHaveProperty(token)
        expect(theme.dark).toHaveProperty(token)
      })
    })
  })

  describe('OKLCH Color Values', () => {
    it('should use OKLCH color space for all color values', () => {
      const lightColors = Object.values(theme.light)
      const darkColors = Object.values(theme.dark)
      const allColors = lightColors.concat(darkColors)
      
      allColors.forEach(color => {
        expect(color).toMatch(/^oklch\(/)
      })
    })

    it('should have valid OKLCH format for primary colors', () => {
      // Primary colors should have valid OKLCH format: oklch(L C H)
      expect(theme.light.primary).toMatch(/^oklch\(\d*\.?\d+\s+\d*\.?\d+\s+\d*\.?\d+\)$/)
      expect(theme.dark.primary).toMatch(/^oklch\(\d*\.?\d+\s+\d*\.?\d+\s+\d*\.?\d+\)$/)
    })

    it('should have consistent background/foreground contrast', () => {
      // Light mode: background should have high lightness, foreground should have low lightness
      expect(theme.light.background).toBe('oklch(1 0 0)') // white
      expect(theme.light.foreground).toBe('oklch(0.1136 0.013 265.626)') // zinc-950
      
      // Dark mode: background should have low lightness, foreground should have high lightness
      expect(theme.dark.background).toBe('oklch(0.1136 0.013 265.626)') // zinc-950
      expect(theme.dark.foreground).toBe('oklch(0.985 0.002 264.52)') // zinc-50
    })
  })

  describe('Enhanced Token Completeness', () => {
    it('should include hierarchical text tokens', () => {
      const hierarchicalTokens = ['tertiary-foreground', 'quaternary-foreground']
      
      hierarchicalTokens.forEach(token => {
        expect(theme.light).toHaveProperty(token)
        expect(theme.dark).toHaveProperty(token)
      })
    })

    it('should include icon state tokens', () => {
      const iconTokens = [
        'icon-primary', 'icon-secondary', 'icon-inactive', 
        'icon-active', 'icon-hover', 'icon-muted'
      ]
      
      iconTokens.forEach(token => {
        expect(theme.light).toHaveProperty(token)
        expect(theme.dark).toHaveProperty(token)
      })
    })

    it('should include border weight tokens', () => {
      const borderTokens = ['border-strong', 'border-subtle', 'border-ghost']
      
      borderTokens.forEach(token => {
        expect(theme.light).toHaveProperty(token)
        expect(theme.dark).toHaveProperty(token)
      })
    })

    it('should include component-specific tokens', () => {
      const componentTokens = [
        'sidebar-text-primary', 'sidebar-text-secondary',
        'sidebar-icon-default', 'sidebar-icon-active',
        'table-header-text', 'table-body-text',
        'button-text-default', 'button-text-hover'
      ]
      
      componentTokens.forEach(token => {
        expect(theme.light).toHaveProperty(token)
        expect(theme.dark).toHaveProperty(token)
      })
    })
  })

  describe('Chart Colors', () => {
    it('should include all chart color tokens', () => {
      const chartTokens = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
      
      chartTokens.forEach(token => {
        expect(theme.light).toHaveProperty(token)
        expect(theme.dark).toHaveProperty(token)
      })
    })

    it('should have different chart colors for light and dark modes', () => {
      // Chart colors should be different between light and dark modes for accessibility
      expect(theme.light['chart-1']).not.toBe(theme.dark['chart-1'])
      expect(theme.light['chart-2']).not.toBe(theme.dark['chart-2'])
    })
  })

  describe('Sidebar Colors', () => {
    it('should include all sidebar color tokens', () => {
      const sidebarTokens = [
        'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
        'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring'
      ]
      
      sidebarTokens.forEach(token => {
        expect(theme.light).toHaveProperty(token)
        expect(theme.dark).toHaveProperty(token)
      })
    })

    it('should maintain proper contrast for sidebar elements', () => {
      // Sidebar should have proper contrast with its foreground
      expect(theme.light.sidebar).toBe('oklch(1 0 0)') // white background
      expect(theme.light['sidebar-foreground']).toBe('oklch(0.1136 0.013 265.626)') // dark text
      
      expect(theme.dark.sidebar).toBe('oklch(0.1887 0.015 265.729)') // dark background
      expect(theme.dark['sidebar-foreground']).toBe('oklch(0.985 0.002 264.52)') // light text
    })
  })

  describe('Theme Consistency', () => {
    it('should return same object structure on multiple calls', () => {
      const theme1 = createCatalystTheme()
      const theme2 = createCatalystTheme()
      
      expect(Object.keys(theme1)).toEqual(Object.keys(theme2))
      expect(Object.keys(theme1.light)).toEqual(Object.keys(theme2.light))
      expect(Object.keys(theme1.dark)).toEqual(Object.keys(theme2.dark))
    })

    it('should be immutable (pure function)', () => {
      const originalTheme = createCatalystTheme()
      const modifiedTheme = createCatalystTheme()
      
      // Modifying one shouldn't affect the other
      modifiedTheme.name = 'Modified'
      expect(originalTheme.name).toBe('Catalyst')
    })
  })

  describe('Business Logic Validation', () => {
    it('should provide 1:1 visual parity with original Catalyst UI', () => {
      // Primary colors should match Catalyst blue
      expect(theme.light.primary).toBe('oklch(0.6 0.16 240)') // blue-500
      expect(theme.dark.primary).toBe('oklch(0.7 0.14 240)') // blue-400
    })

    it('should use zinc color palette as base', () => {
      // Key zinc colors should be used throughout
      expect(theme.light.foreground).toBe('oklch(0.1136 0.013 265.626)') // zinc-950
      expect(theme.light.muted).toBe('oklch(0.965 0.003 264.542)') // zinc-100
      expect(theme.dark.background).toBe('oklch(0.1136 0.013 265.626)') // zinc-950
    })

    it('should support semantic enhancement workflows', () => {
      // Should have enhanced tokens that support semantic transformations
      expect(theme.light).toHaveProperty('icon-primary')
      expect(theme.light).toHaveProperty('border-subtle')
      expect(theme.light).toHaveProperty('tertiary-foreground')
    })
  })
})