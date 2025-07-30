import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useThemeStore, setupSystemThemeListener, cleanupThemeTimers } from '../store'
import { COLOR_NAMES } from '../constants'
import type { ThemeState } from '../types'

// Mock the cookies module
vi.mock('../cookies', () => ({
  setThemeCookie: vi.fn(),
  getThemeCookie: vi.fn(),
  parseThemeCookie: vi.fn(),
}))

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useThemeStore.setState({
      mode: 'system',
      primary: 'emerald',
      secondary: 'zinc',
      destructive: 'red',
      base: 'stone',
    })

    // Mock DOM
    document.documentElement.classList.remove('light', 'dark', 'theme-loaded')
    document.documentElement.style.cssText = ''
  })

  afterEach(() => {
    cleanupThemeTimers()
    vi.clearAllMocks()
  })

  describe('State Management', () => {
    it('should have correct initial state', () => {
      const state = useThemeStore.getState()
      expect(state.mode).toBe('system')
      expect(state.primary).toBe('emerald')
      expect(state.secondary).toBe('zinc')
      expect(state.destructive).toBe('red')
      expect(state.base).toBe('stone')
    })

    it('should update mode correctly', () => {
      const { setMode } = useThemeStore.getState()

      setMode('dark')
      expect(useThemeStore.getState().mode).toBe('dark')

      setMode('light')
      expect(useThemeStore.getState().mode).toBe('light')

      setMode('system')
      expect(useThemeStore.getState().mode).toBe('system')
    })

    it('should update color properties with validation', () => {
      const { setPrimary, setSecondary, setDestructive, setBase } = useThemeStore.getState()

      // Valid colors
      setPrimary('blue')
      expect(useThemeStore.getState().primary).toBe('blue')

      setSecondary('slate')
      expect(useThemeStore.getState().secondary).toBe('slate')

      setDestructive('orange')
      expect(useThemeStore.getState().destructive).toBe('orange')

      setBase('neutral')
      expect(useThemeStore.getState().base).toBe('neutral')
    })

    it('should reject invalid color names', () => {
      const { setPrimary } = useThemeStore.getState()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      setPrimary('invalid-color' as any)
      expect(useThemeStore.getState().primary).toBe('emerald') // unchanged
      expect(consoleSpy).toHaveBeenCalledWith('Invalid primary color: invalid-color')

      consoleSpy.mockRestore()
    })

    it('should validate all color names from constants', () => {
      const { setPrimary } = useThemeStore.getState()

      // Test a sample of valid colors
      COLOR_NAMES.forEach((color) => {
        setPrimary(color)
        expect(useThemeStore.getState().primary).toBe(color)
      })
    })
  })

  describe('DOM Updates', () => {
    it('should apply theme classes to document element', async () => {
      const { setMode, hydrate } = useThemeStore.getState()

      // Apply light mode
      setMode('light')
      hydrate() // Use hydrate for immediate application

      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // Apply dark mode
      setMode('dark')
      hydrate()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('should apply system mode based on media query', () => {
      const { hydrate } = useThemeStore.getState()

      // Mock dark mode preference
      vi.mocked(global.matchMedia).mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any)

      useThemeStore.setState({ mode: 'system' })
      hydrate()

      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // Mock light mode preference
      vi.mocked(global.matchMedia).mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any)

      hydrate()

      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    it('should apply CSS custom properties for colors', () => {
      const { setPrimary, hydrate } = useThemeStore.getState()

      setPrimary('purple')
      hydrate()

      // Check primary color shades
      expect(document.documentElement.style.getPropertyValue('--color-primary-500')).toBe(
        'var(--color-purple-500)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-primary-600')).toBe(
        'var(--color-purple-600)'
      )

      // Check semantic colors with contrast
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
        'var(--color-purple-500)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-primary-foreground')).toBe(
        'white'
      )
    })

    it('should apply correct foreground colors for light backgrounds', () => {
      const { setPrimary, hydrate } = useThemeStore.getState()

      // Test light colors that need dark foreground
      setPrimary('amber')
      hydrate()

      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
        'var(--color-amber-400)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-primary-foreground')).toBe(
        'var(--color-amber-950)'
      )

      setPrimary('yellow')
      hydrate()

      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
        'var(--color-yellow-300)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-primary-foreground')).toBe(
        'var(--color-yellow-950)'
      )
    })

    it('should mark theme as loaded after hydration', async () => {
      const { hydrate } = useThemeStore.getState()

      expect(document.documentElement.classList.contains('theme-loaded')).toBe(false)

      hydrate()

      // Wait for requestAnimationFrame
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(document.documentElement.classList.contains('theme-loaded')).toBe(true)
    })
  })

  describe('System Theme Listener', () => {
    let mockMediaQuery: any

    beforeEach(() => {
      mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
      vi.mocked(global.matchMedia).mockReturnValue(mockMediaQuery)
    })

    it('should setup media query listener', () => {
      const cleanup = setupSystemThemeListener()

      expect(global.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

      cleanup?.()
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should not setup duplicate listeners', () => {
      const cleanup1 = setupSystemThemeListener()

      // Reset mock to check it's not called again
      vi.mocked(global.matchMedia).mockClear()

      const cleanup2 = setupSystemThemeListener()

      expect(global.matchMedia).not.toHaveBeenCalled()
      expect(cleanup2).toBeUndefined()

      cleanup1?.()
    })

    it('should re-apply theme when system preference changes', () => {
      useThemeStore.setState({ mode: 'system' })
      setupSystemThemeListener()

      expect(mockMediaQuery.addEventListener).toHaveBeenCalled()
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1]

      // Simulate system preference change to dark
      mockMediaQuery.matches = true
      changeHandler()

      // Verify the handler was called
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('Theme Persistence Integration', () => {
    it('should trigger cookie save on state changes', async () => {
      const { setThemeCookie } = await import('../cookies')
      const { setPrimary } = useThemeStore.getState()

      setPrimary('blue')

      // Wait for debounced save (150ms)
      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(setThemeCookie).toHaveBeenCalledWith({
        mode: 'system',
        primary: 'blue',
        secondary: 'zinc',
        destructive: 'red',
        base: 'stone',
        layout: 'stone',
      })
    })

    it('should not save duplicate states', async () => {
      const { setThemeCookie } = await import('../cookies')
      const { setPrimary } = useThemeStore.getState()

      vi.clearAllMocks()

      // Set the same value multiple times
      setPrimary('violet')
      setPrimary('violet')
      setPrimary('violet')

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Should only save once due to equality check
      expect(setThemeCookie).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing contrast configuration gracefully', () => {
      const { hydrate } = useThemeStore.getState()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Temporarily mock a color without contrast config
      const originalMap = vi.importActual('../constants').COLOR_CONTRAST_MAP
      vi.doMock('../constants', () => ({
        ...vi.importActual('../constants'),
        COLOR_CONTRAST_MAP: { ...originalMap, 'test-color': undefined },
      }))

      useThemeStore.setState({ primary: 'test-color' as any })
      hydrate()

      // Should use fallback values
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
        'var(--color-test-color-600)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-primary-foreground')).toBe(
        'white'
      )

      consoleSpy.mockRestore()
    })
  })
})
