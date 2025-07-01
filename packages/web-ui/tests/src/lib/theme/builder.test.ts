import { describe, it, expect } from 'vitest'
import {
  withPrimaryColor,
  withBackgroundColors,
  withCardColors,
  withSidebarColors,
  withAccentColor,
  withDestructiveColor,
  autoComplete,
  compose,
  createThemeState,
  buildTheme,
  createTheme,
} from '../../../../src/components/theme/builder'

describe('theme-builder', () => {
  describe('Theme Building Workflow', () => {
    it('should build complete theme using functional composition', () => {
      const theme = createTheme('Custom Theme')
        .withPrimaryColor('oklch(0.7 0.2 120)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.145 0 0)')
        .withChartColors([
          'oklch(0.7 0.15 30)',
          'oklch(0.6 0.15 120)',
          'oklch(0.65 0.15 210)',
          'oklch(0.55 0.15 300)',
          'oklch(0.75 0.15 60)',
        ])
        .build()

      expect(theme.name).toBe('Custom Theme')
      expect(theme.light.primary).toBe('oklch(0.7 0.2 120)')
      expect(theme.light.background).toBe('oklch(1 0 0)')
      expect(theme.light.foreground).toBe('oklch(0.145 0 0)')
      expect(theme.light['chart-1']).toBe('oklch(0.7 0.15 30)')

      expect(theme.dark.primary).toMatch(/oklch\(0\.3/)
      expect(theme.dark.background).toMatch(/oklch\(0/)
      expect(theme.dark.foreground).toMatch(/oklch/)
    })

    it('should compose theme transformations using compose', () => {
      const themeTransform = compose(
        withPrimaryColor('oklch(0.6 0.25 250)'),
        withBackgroundColors('oklch(0.99 0 0)', 'oklch(0.145 0 0)')
      )

      const state = themeTransform(createThemeState('Composed Theme'))
      const theme = buildTheme(state)

      expect(theme.light.primary).toBe('oklch(0.6 0.25 250)')
      expect(theme.light.background).toBe('oklch(0.99 0 0)')
      expect(theme.light.foreground).toBe('oklch(0.145 0 0)')

      expect(theme.light.card).toBe('oklch(0.99 0 0)')
      expect(theme.light['card-foreground']).toBe('oklch(0.145 0 0)')

      expect(theme.dark.primary).toMatch(/oklch/)
      expect(theme.dark.background).toMatch(/oklch/)
    })

    it('should handle sidebar color variations', () => {
      const baseState = compose(
        withBackgroundColors('oklch(1 0 0)', 'oklch(0.145 0 0)'),
        withCardColors('oklch(0.98 0 0)', 'oklch(0.2 0 0)'),
        withPrimaryColor('oklch(0.7 0.2 250)')
      )(createThemeState('Test'))

      const backgroundSidebar = withSidebarColors('background')(baseState)
      expect(backgroundSidebar.light.sidebar).toBe('oklch(1 0 0)')

      const cardSidebar = withSidebarColors('card')(baseState)
      expect(cardSidebar.light.sidebar).toBe('oklch(0.98 0 0)')
      expect(cardSidebar.light['sidebar-foreground']).toMatch(/oklch/)

      const customSidebar = withSidebarColors('custom', {
        light: { bg: 'oklch(0.95 0 0)', fg: 'oklch(0.2 0 0)' },
        dark: { bg: 'oklch(0.15 0 0)', fg: 'oklch(0.9 0 0)' },
      })(baseState)
      expect(customSidebar.light.sidebar).toBe('oklch(0.95 0 0)')
      expect(customSidebar.dark.sidebar).toBe('oklch(0.15 0 0)')
    })

    it('should support component-specific overrides', () => {
      const theme = createTheme('With Overrides')
        .withPrimaryColor('oklch(0.7 0.2 250)')
        .withComponentOverrides({
          button: {
            'primary-bg': 'oklch(0.65 0.22 250)',
            'primary-text': 'oklch(1 0 0)',
            'primary-hover': 'oklch(0.4 0.18 250)',
          },
          input: {
            border: 'oklch(0.85 0.01 250)',
            'border-focus': 'oklch(0.7 0.2 250)',
          },
        })
        .build()

      expect(theme.components?.button?.['primary-bg']).toBe('oklch(0.65 0.22 250)')
      expect(theme.components?.button?.['primary-text']).toBe('oklch(1 0 0)')
      expect(theme.components?.input?.border).toBe('oklch(0.85 0.01 250)')
    })
  })

  describe('Theme Builder API', () => {
    it('should create themes with fluent API', () => {
      const theme = createTheme('Test')
        .withPrimaryColor('oklch(0.6 0.25 250)')
        .withAccentColor('oklch(0.8 0.15 300)')
        .build()

      expect(theme.name).toBe('Test')
      expect(theme.light.primary).toBe('oklch(0.6 0.25 250)')
      expect(theme.light.accent).toBe('oklch(0.8 0.15 300)')
    })

    it('should create themes with functional composition', () => {
      const theme = buildTheme(
        compose(
          withPrimaryColor('oklch(0.6 0.25 250)'),
          withAccentColor('oklch(0.8 0.15 300)')
        )(createThemeState('Test'))
      )

      expect(theme.name).toBe('Test')
      expect(theme.light.primary).toBe('oklch(0.6 0.25 250)')
      expect(theme.light.accent).toBe('oklch(0.8 0.15 300)')
    })
  })

  describe('Functional Composition Utilities', () => {
    it('should compose multiple theme builders', () => {
      const addBrandColors = compose(
        withPrimaryColor('oklch(0.55 0.3 200)'),
        withAccentColor('oklch(0.65 0.25 30)')
      )

      const addUIColors = compose(
        withBackgroundColors('oklch(0.99 0 0)', 'oklch(0.145 0 0)'),
        withDestructiveColor('oklch(0.65 0.25 20)')
      )

      const composedTransform = compose(addBrandColors, addUIColors, autoComplete)
      const theme = composedTransform(createThemeState('Composed'))

      expect(theme.light.primary).toBe('oklch(0.55 0.3 200)')
      expect(theme.light.accent).toBe('oklch(0.65 0.25 30)')
      expect(theme.light.background).toBe('oklch(0.99 0 0)')
      expect(theme.light.destructive).toBe('oklch(0.65 0.25 20)')
    })
  })
})
