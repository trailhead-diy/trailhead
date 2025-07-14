'use client'

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'
import {
  createThemeMap,
  addTheme as addThemeToMap,
  getTheme,
  getThemeNames,
  applyThemeToDocument,
  type ThemeMap,
  type TrailheadThemeConfig,
} from './registry'

interface ThemeContextValue {
  currentTheme: string | null
  isDark: boolean
  themes: string[]
  setTheme: (name: string) => void
  toggleDarkMode: () => void
  registerTheme: (name: string, config: TrailheadThemeConfig) => void
}

// Create theme context
const ThemeContext = createContext<{
  themes: ThemeMap
  addTheme: (name: string, config: TrailheadThemeConfig) => void
} | null>(null)

/**
 * Parse theme name and dark mode state from next-themes format
 */
function parseTheme(theme: string | undefined, systemTheme: string | undefined): [string, boolean] {
  let currentTheme = 'zinc'
  let isDark = false

  if (theme === 'system') {
    isDark = systemTheme === 'dark'
    currentTheme = 'zinc'
  } else if (theme === 'dark') {
    isDark = true
    currentTheme = 'zinc'
  } else if (theme === 'light') {
    isDark = false
    currentTheme = 'zinc'
  } else if (theme) {
    if (theme.endsWith('-dark')) {
      currentTheme = theme.replace('-dark', '')
      isDark = true
    } else {
      currentTheme = theme
      isDark = false
    }
  }

  return [currentTheme, isDark]
}

/**
 * Hook to access theme context
 */
const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return context
}

/**
 * Hook that bridges next-themes with our theme system
 */
export function useTheme(): ThemeContextValue {
  const { theme, setTheme: nextSetTheme, systemTheme } = useNextTheme()
  const { themes, addTheme } = useThemeContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Parse theme and dark mode state
  const [currentTheme, isDark] = parseTheme(theme, systemTheme)

  // Apply theme CSS when theme changes
  useEffect(() => {
    if (mounted && currentTheme) {
      // Update dark mode class
      document.documentElement.classList.toggle('dark', isDark)

      // Apply theme CSS variables
      applyThemeToDocument(themes, currentTheme, isDark)
    }
  }, [currentTheme, isDark, mounted, themes])

  const setTheme = useCallback(
    (name: string) => {
      // Validate theme exists
      if (!getTheme(themes, name)) {
        console.error(`Theme "${name}" is not registered`)
        return
      }
      // Set theme with current dark mode state
      nextSetTheme(isDark ? `${name}-dark` : name)
    },
    [themes, isDark, nextSetTheme]
  )

  const toggleDarkMode = useCallback(() => {
    if (currentTheme === 'zinc' && (theme === 'light' || theme === 'dark' || theme === 'system')) {
      // Toggle global dark mode
      nextSetTheme(isDark ? 'light' : 'dark')
    } else {
      // Toggle for specific theme
      nextSetTheme(isDark ? currentTheme : `${currentTheme}-dark`)
    }
  }, [currentTheme, theme, isDark, nextSetTheme])

  const registerTheme = useCallback(
    (name: string, config: TrailheadThemeConfig) => {
      addTheme(name, config)
    },
    [addTheme]
  )

  return {
    currentTheme: mounted ? currentTheme : null,
    isDark: mounted ? isDark : false,
    themes: getThemeNames(themes),
    setTheme,
    toggleDarkMode,
    registerTheme,
  }
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: string
  storageKey?: string
  enableSystem?: boolean
}

/**
 * Theme provider that integrates next-themes with our theme system
 * Uses next-themes to handle SSR without hydration issues
 */
export function ThemeProvider({
  children,
  defaultTheme = 'zinc',
  storageKey = 'theme',
  enableSystem = true,
}: ThemeProviderProps) {
  // Initialize theme map with all built-in and preset themes
  const [themes, setThemes] = useState<ThemeMap>(() => createThemeMap())

  // Add theme function that updates state
  const addTheme = useCallback((name: string, config: TrailheadThemeConfig) => {
    setThemes((current) => addThemeToMap(current, name, config))
  }, [])

  // Generate all possible theme names
  const availableThemes = getThemeNames(themes)
  const allThemes = [
    'light',
    'dark',
    ...availableThemes,
    ...availableThemes.map((t) => `${t}-dark`),
  ]

  return (
    <ThemeContext.Provider value={{ themes, addTheme }}>
      <NextThemesProvider
        themes={allThemes}
        defaultTheme={defaultTheme}
        storageKey={storageKey}
        enableSystem={enableSystem}
        enableColorScheme={false} // We handle this ourselves
        disableTransitionOnChange
        attribute="data-theme" // Use data-theme attribute to match our styling
      >
        {children}
      </NextThemesProvider>
    </ThemeContext.Provider>
  )
}
