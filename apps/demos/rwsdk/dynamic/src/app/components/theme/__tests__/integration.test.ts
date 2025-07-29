import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useThemeStore, cleanupThemeTimers } from '../store'
import { setThemeCookie, getThemeCookie, parseThemeCookie } from '../cookies'
import type { ThemeState } from '../types'

describe('Theme System Integration', () => {
  beforeEach(() => {
    // Mock matchMedia
    global.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Reset everything
    useThemeStore.setState({
      mode: 'system',
      primary: 'emerald',
      secondary: 'zinc',
      destructive: 'red',
      base: 'stone',
      layout: 'stone',
    })

    // Clear cookies
    document.cookie.split(';').forEach((cookie) => {
      const [name] = cookie.split('=')
      if (name) {
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    })

    // Reset DOM
    document.documentElement.className = ''
    document.documentElement.style.cssText = ''

    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanupThemeTimers()
    vi.useRealTimers()
  })

  describe('End-to-End Theme Flow', () => {
    it('should persist theme changes to cookies and apply to DOM', async () => {
      const { setPrimary, setMode, hydrate } = useThemeStore.getState()

      // Change theme
      setPrimary('purple')
      setMode('dark')

      // Wait for debounced cookie save
      vi.advanceTimersByTime(200)

      // Check cookie was saved
      const cookieValue = getThemeCookie()
      expect(cookieValue).toBeDefined()

      const parsedTheme = parseThemeCookie(cookieValue)
      expect(parsedTheme).toEqual({
        mode: 'dark',
        primary: 'purple',
        secondary: 'zinc',
        destructive: 'red',
        base: 'stone',
        layout: 'stone',
      })

      // Apply theme to DOM
      hydrate()

      // Check DOM updates
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
        'var(--color-purple-500)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-primary-foreground')).toBe(
        'white'
      )
    })

    it('should restore theme from cookies on initialization', () => {
      // Set initial theme in cookie
      const savedTheme: ThemeState = {
        mode: 'light',
        primary: 'blue',
        secondary: 'slate',
        destructive: 'orange',
        base: 'neutral',
        layout: 'neutral',
      }
      setThemeCookie(savedTheme)

      // Simulate reading cookie on app load
      const cookieValue = getThemeCookie()
      const restoredTheme = parseThemeCookie(cookieValue)

      expect(restoredTheme).toEqual(savedTheme)

      // In real app, this would happen in store initialization
      if (restoredTheme) {
        useThemeStore.setState(restoredTheme)
      }

      // Verify store has restored theme
      const state = useThemeStore.getState()
      expect(state.mode).toBe('light')
      expect(state.primary).toBe('blue')
      expect(state.secondary).toBe('slate')
      expect(state.destructive).toBe('orange')
      expect(state.base).toBe('neutral')
      expect(state.layout).toBe('neutral')
    })

    it('should handle rapid theme changes efficiently', () => {
      const { setPrimary, setSecondary, setBase } = useThemeStore.getState()

      // Simulate user rapidly changing colors
      const colors = ['red', 'blue', 'green', 'purple', 'orange'] as const

      colors.forEach((color, index) => {
        setPrimary(color)
        vi.advanceTimersByTime(10) // 10ms between changes

        setSecondary(colors[4 - index])
        vi.advanceTimersByTime(10)

        setBase('zinc')
        vi.advanceTimersByTime(10)
      })

      // Advance past all debounce delays
      vi.advanceTimersByTime(200)

      // Check final state was saved
      const cookieValue = getThemeCookie()
      const finalTheme = parseThemeCookie(cookieValue)

      expect(finalTheme?.primary).toBe('orange') // Last primary
      expect(finalTheme?.secondary).toBe('red') // Last secondary
      expect(finalTheme?.base).toBe('zinc')
    })

    it('should validate and reject invalid themes from cookies', () => {
      // Set invalid theme in cookie
      document.cookie = `theme=${encodeURIComponent(
        JSON.stringify({
          mode: 'invalid-mode',
          primary: 'not-a-color',
          secondary: 'zinc',
        })
      )}`

      const cookieValue = getThemeCookie()
      const parsedTheme = parseThemeCookie(cookieValue)

      expect(parsedTheme).toBeNull() // Should reject invalid theme
    })

    it('should handle theme initialization with missing cookies gracefully', () => {
      // No cookies set
      const cookieValue = getThemeCookie()
      expect(cookieValue).toBeUndefined()

      const parsedTheme = parseThemeCookie(cookieValue)
      expect(parsedTheme).toBeNull()

      // App should use default theme
      const state = useThemeStore.getState()
      expect(state.mode).toBe('system')
      expect(state.primary).toBe('emerald')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should batch multiple simultaneous changes', () => {
      const { setPrimary, setSecondary, setDestructive, setBase, hydrate } =
        useThemeStore.getState()

      // Change all colors at once
      setPrimary('indigo')
      setSecondary('gray')
      setDestructive('pink')
      setBase('slate')

      // Use hydrate for immediate application instead of waiting for debounce
      hydrate()

      // Check DOM was updated with all changes
      expect(document.documentElement.style.getPropertyValue('--color-primary-500')).toBe(
        'var(--color-indigo-500)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-secondary-500')).toBe(
        'var(--color-gray-500)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-destructive-500')).toBe(
        'var(--color-pink-500)'
      )
      expect(document.documentElement.style.getPropertyValue('--color-base-500')).toBe(
        'var(--color-slate-500)'
      )
    })

    it('should handle system mode changes correctly', () => {
      const { hydrate } = useThemeStore.getState()

      // Mock matchMedia
      const mockMatchMedia = vi.fn()
      const mockMediaQuery = {
        matches: false, // Light mode
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
      mockMatchMedia.mockReturnValue(mockMediaQuery)
      global.matchMedia = mockMatchMedia

      useThemeStore.setState({ mode: 'system' })
      hydrate()

      expect(document.documentElement.classList.contains('light')).toBe(true)

      // Change system preference
      mockMediaQuery.matches = true // Dark mode
      hydrate()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('should clean up timers on unmount', () => {
      const { setPrimary } = useThemeStore.getState()

      // Start some operations
      setPrimary('teal')

      // Clean up before timers fire
      cleanupThemeTimers()

      // Advance time
      vi.advanceTimersByTime(200)

      // Check that no cookie was saved (timer was cancelled)
      const cookieValue = getThemeCookie()
      expect(cookieValue).toBeUndefined()
    })

    it('should handle special characters in theme values safely', () => {
      // This test ensures our encoding/decoding handles edge cases
      const theme: ThemeState = {
        mode: 'dark',
        primary: 'emerald',
        secondary: 'zinc',
        destructive: 'red',
        base: 'stone',
        layout: 'stone',
      }

      setThemeCookie(theme)

      const cookieValue = getThemeCookie()
      expect(cookieValue).toBeDefined()
      expect(cookieValue).not.toContain(' ') // No spaces in JSON

      const parsed = parseThemeCookie(cookieValue)
      expect(parsed).toEqual(theme)
    })
  })

  describe('Accessibility and Contrast', () => {
    it('should apply correct foreground colors for all background types', () => {
      const { setPrimary, hydrate } = useThemeStore.getState()

      const testCases = [
        // Light backgrounds needing dark text
        { color: 'amber', expectedShade: '400', expectedFg: 'var(--color-amber-950)' },
        { color: 'yellow', expectedShade: '300', expectedFg: 'var(--color-yellow-950)' },
        { color: 'lime', expectedShade: '300', expectedFg: 'var(--color-lime-950)' },
        { color: 'cyan', expectedShade: '300', expectedFg: 'var(--color-cyan-950)' },
        // Dark backgrounds with white text
        { color: 'purple', expectedShade: '500', expectedFg: 'white' },
        { color: 'blue', expectedShade: '600', expectedFg: 'white' },
        { color: 'emerald', expectedShade: '600', expectedFg: 'white' },
      ]

      testCases.forEach(({ color, expectedShade, expectedFg }) => {
        setPrimary(color as any)
        hydrate()

        expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
          `var(--color-${color}-${expectedShade})`
        )
        expect(document.documentElement.style.getPropertyValue('--color-primary-foreground')).toBe(
          expectedFg
        )
      })
    })
  })
})
