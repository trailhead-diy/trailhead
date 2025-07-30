import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setThemeCookie, getThemeCookie, parseThemeCookie } from '../cookies'
import type { ThemeState } from '../types'

describe('Theme Cookie Persistence', () => {
  // Mock document.cookie
  let cookieStore: Record<string, string> = {}

  beforeEach(() => {
    cookieStore = {}

    // Mock document.cookie getter/setter
    Object.defineProperty(document, 'cookie', {
      get: () => {
        return Object.entries(cookieStore)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')
      },
      set: (value: string) => {
        const [pair] = value.split(';')
        const [key, val] = pair.split('=')
        if (val) {
          cookieStore[key] = val
        } else {
          delete cookieStore[key]
        }
      },
      configurable: true,
    })
  })

  describe('setThemeCookie', () => {
    it('should save theme state to cookie with proper encoding', () => {
      const theme: ThemeState = {
        mode: 'dark',
        primary: 'emerald',
        secondary: 'zinc',
        destructive: 'red',
        base: 'stone',
        layout: 'stone',
      }

      setThemeCookie(theme)

      expect(cookieStore['theme']).toBeDefined()
      const decoded = decodeURIComponent(cookieStore['theme'])
      const parsed = JSON.parse(decoded)
      expect(parsed).toEqual(theme)
    })

    it('should set cookie with correct attributes', () => {
      const theme: ThemeState = {
        mode: 'light',
        primary: 'blue',
        secondary: 'gray',
        destructive: 'red',
        base: 'neutral',
        layout: 'neutral',
      }

      let setCookieValue = ''
      document.cookie = ''
      Object.defineProperty(document, 'cookie', {
        set: (value: string) => {
          setCookieValue = value
        },
        configurable: true,
      })

      setThemeCookie(theme)

      expect(setCookieValue).toContain('theme=')
      expect(setCookieValue).toContain('path=/')
      expect(setCookieValue).toContain('SameSite=Strict')
      expect(setCookieValue).toContain('max-age=31536000') // 1 year
    })
  })

  describe('getThemeCookie', () => {
    it('should retrieve theme cookie value', () => {
      const theme: ThemeState = {
        mode: 'system',
        primary: 'violet',
        secondary: 'slate',
        destructive: 'rose',
        base: 'zinc',
        layout: 'zinc',
      }

      cookieStore['theme'] = encodeURIComponent(JSON.stringify(theme))

      const result = getThemeCookie()
      expect(result).toBe(JSON.stringify(theme))
    })

    it('should return undefined when cookie does not exist', () => {
      const result = getThemeCookie()
      expect(result).toBeUndefined()
    })

    it('should handle multiple cookies correctly', () => {
      cookieStore['other'] = 'value'
      cookieStore['theme'] = encodeURIComponent(JSON.stringify({ mode: 'dark' }))
      cookieStore['another'] = 'test'

      const result = getThemeCookie()
      expect(result).toBe(JSON.stringify({ mode: 'dark' }))
    })
  })

  describe('parseThemeCookie', () => {
    it('should parse valid theme cookie', () => {
      const theme: ThemeState = {
        mode: 'dark',
        primary: 'purple',
        secondary: 'neutral',
        destructive: 'red',
        base: 'gray',
        layout: 'gray',
      }

      // parseThemeCookie expects already decoded JSON string
      const result = parseThemeCookie(JSON.stringify(theme))

      expect(result).toEqual(theme)
    })

    it('should return null for invalid JSON', () => {
      const result = parseThemeCookie('invalid-json')
      expect(result).toBeNull()
    })

    it('should return null for undefined input', () => {
      const result = parseThemeCookie(undefined)
      expect(result).toBeNull()
    })

    it('should validate required theme properties', () => {
      const invalidThemes = [
        { mode: 'dark' }, // missing other props
        { primary: 'blue', secondary: 'gray' }, // missing mode
        {
          mode: 'light',
          primary: 'invalid-color',
          secondary: 'zinc',
          destructive: 'red',
          base: 'stone',
          layout: 'stone',
        },
        'not-an-object',
        null,
        [],
      ]

      invalidThemes.forEach((invalid) => {
        const result = parseThemeCookie(JSON.stringify(invalid))
        expect(result).toBeNull()
      })
    })

    it('should validate color values are from allowed list', () => {
      const themeWithInvalidColor = {
        mode: 'light',
        primary: 'not-a-color',
        secondary: 'zinc',
        destructive: 'red',
        base: 'stone',
        layout: 'stone',
      }

      const result = parseThemeCookie(JSON.stringify(themeWithInvalidColor))
      expect(result).toBeNull()
    })

    it('should validate mode values', () => {
      const themeWithInvalidMode = {
        mode: 'auto', // should be 'system'
        primary: 'blue',
        secondary: 'zinc',
        destructive: 'red',
        base: 'stone',
        layout: 'stone',
      }

      const result = parseThemeCookie(JSON.stringify(themeWithInvalidMode))
      expect(result).toBeNull()
    })
  })

  describe('Integration: Cookie Persistence Flow', () => {
    it('should handle complete save and retrieve flow', () => {
      const theme: ThemeState = {
        mode: 'system',
        primary: 'teal',
        secondary: 'slate',
        destructive: 'orange',
        base: 'neutral',
        layout: 'neutral',
      }

      // Save theme
      setThemeCookie(theme)

      // Retrieve and parse
      const cookieValue = getThemeCookie()
      const parsed = parseThemeCookie(cookieValue)

      expect(parsed).toEqual(theme)
    })

    it('should handle theme updates correctly', () => {
      const initialTheme: ThemeState = {
        mode: 'light',
        primary: 'blue',
        secondary: 'gray',
        destructive: 'red',
        base: 'zinc',
        layout: 'zinc',
      }

      const updatedTheme: ThemeState = {
        ...initialTheme,
        mode: 'dark',
        primary: 'purple',
      }

      // Set initial theme
      setThemeCookie(initialTheme)
      let parsed = parseThemeCookie(getThemeCookie())
      expect(parsed).toEqual(initialTheme)

      // Update theme
      setThemeCookie(updatedTheme)
      parsed = parseThemeCookie(getThemeCookie())
      expect(parsed).toEqual(updatedTheme)
    })
  })
})
