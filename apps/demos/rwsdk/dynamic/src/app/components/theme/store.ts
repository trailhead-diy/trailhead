'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  COLOR_NAMES,
  COLOR_CONTRAST_MAP,
  COLOR_SHADES,
  validateColorContrastMap,
} from './constants'
import { setThemeCookie, getThemeCookie, parseThemeCookie } from './cookies'
import { debounce } from './utils/debounce'
import type { ThemeStore, ThemeState, ColorName } from './types'

// Validate color contrast map on module load in development
if (process.env.NODE_ENV === 'development') {
  validateColorContrastMap()
}
/**
 * Default theme configuration
 */
const DEFAULT_THEME: ThemeState = {
  mode: 'system',
  primary: 'emerald',
  secondary: 'zinc',
  destructive: 'red',
  base: 'stone',
  layout: 'stone',
}

/**
 * Validates if a string is a valid color name
 */
function isValidColorName(value: string): value is ColorName {
  return COLOR_NAMES.includes(value as ColorName)
}

/**
 * Gets the system color mode preference
 */
function getSystemMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Safely gets contrast configuration for a color
 * Falls back to sensible defaults if color not found
 */
function getColorContrastConfig(color: ColorName) {
  const config = COLOR_CONTRAST_MAP[color]

  if (!config) {
    console.error(`[Theme] Missing contrast config for color: ${color}`)
    // Fallback to safe defaults
    return { shade: '600' as const, foreground: 'white' as const }
  }

  return config
}

/**
 * Applies theme state to the DOM
 *
 * @param state - The theme state to apply
 */
function applyTheme(state: ThemeState) {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  // Determine active mode (resolve 'system' to actual preference)
  const activeMode = state.mode === 'system' ? getSystemMode() : state.mode

  // Update mode class
  root.classList.remove('light', 'dark')
  root.classList.add(activeMode)

  // Apply CSS variable overrides using setProperty to preserve other styles
  COLOR_SHADES.forEach((shade) => {
    root.style.setProperty(`--color-primary-${shade}`, `var(--color-${state.primary}-${shade})`)
    root.style.setProperty(`--color-secondary-${shade}`, `var(--color-${state.secondary}-${shade})`)
    root.style.setProperty(
      `--color-destructive-${shade}`,
      `var(--color-${state.destructive}-${shade})`
    )
    root.style.setProperty(`--color-base-${shade}`, `var(--color-${state.base}-${shade})`)
    root.style.setProperty(`--color-layout-${shade}`, `var(--color-${state.layout}-${shade})`)
  })

  // Apply semantic colors with proper contrast
  const primaryConfig = getColorContrastConfig(state.primary)
  const secondaryConfig = getColorContrastConfig(state.secondary)
  const destructiveConfig = getColorContrastConfig(state.destructive)

  // Set primary color and foreground
  root.style.setProperty('--color-primary', `var(--color-${state.primary}-${primaryConfig.shade})`)
  root.style.setProperty('--color-primary-foreground', primaryConfig.foreground)

  // Set secondary color and foreground
  root.style.setProperty(
    '--color-secondary',
    `var(--color-${state.secondary}-${secondaryConfig.shade})`
  )
  root.style.setProperty('--color-secondary-foreground', secondaryConfig.foreground)

  // Set destructive color and foreground
  root.style.setProperty(
    '--color-destructive',
    `var(--color-${state.destructive}-${destructiveConfig.shade})`
  )
  root.style.setProperty('--color-destructive-foreground', destructiveConfig.foreground)
}

// Track if we're already applying theme to prevent recursive updates
let isApplyingTheme = false

// Debounce delay in milliseconds
const THEME_APPLY_DELAY = 50 // Quick for visual feedback
const COOKIE_SAVE_DELAY = 150 // Balanced delay for cookie writes - prevents excess writes but saves quickly

/**
 * Defers DOM updates to the next animation frame to prevent layout thrashing
 */
function deferDomUpdate(callback: () => void) {
  if (typeof window !== 'undefined' && !isApplyingTheme) {
    isApplyingTheme = true
    requestAnimationFrame(() => {
      callback()
      isApplyingTheme = false
    })
  }
}

/**
 * Debounced theme application to prevent rapid DOM updates
 */
const debouncedApplyTheme = debounce((state: ThemeState) => {
  deferDomUpdate(() => applyTheme(state))
}, THEME_APPLY_DELAY)

/**
 * Debounced cookie saving to prevent excessive writes
 */
const debouncedSaveCookie = debounce(setThemeCookie, COOKIE_SAVE_DELAY)

// Store cleanup function for the global listener
let cleanupSystemThemeListener: (() => void) | null = null

/**
 * Sets up a system theme change listener.
 * This should be called once during app initialization.
 * Returns a cleanup function that should be called on app unmount.
 */
export function setupSystemThemeListener() {
  if (typeof window === 'undefined' || cleanupSystemThemeListener) return

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = () => {
    // Re-apply theme when system preference changes
    useThemeStore.getState().applyTheme()
  }

  mediaQuery.addEventListener('change', handleChange)

  cleanupSystemThemeListener = () => {
    mediaQuery.removeEventListener('change', handleChange)
    cleanupSystemThemeListener = null
  }

  return cleanupSystemThemeListener
}

/**
 * Cleanup function to clear all timers
 * Call this when unmounting the app or during cleanup
 */
export function cleanupThemeTimers() {
  debouncedApplyTheme.cancel()
  debouncedSaveCookie.cancel()

  // Also cleanup system theme listener if it exists
  if (cleanupSystemThemeListener) {
    cleanupSystemThemeListener()
  }
}

/**
 * Gets initial theme state from cookies or defaults
 */
function getInitialTheme(): ThemeState {
  if (typeof window !== 'undefined') {
    const cookieValue = getThemeCookie()
    const parsed = parseThemeCookie(cookieValue)
    if (parsed) return parsed
  }
  return DEFAULT_THEME
}

/**
 * Main theme store using Zustand with cookie persistence.
 *
 * Features:
 * - Automatic persistence to cookies (SSR-safe)
 * - Automatic DOM updates on state changes
 * - Validation for all color inputs
 * - Works with server-side rendering
 */
export const useThemeStore = create<ThemeStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state from cookies or defaults
    ...getInitialTheme(),

    // Actions
    setMode: (mode) => {
      set({ mode })
      debouncedApplyTheme(get())
    },

    setPrimary: (primary) => {
      if (!isValidColorName(primary)) {
        console.warn(`Invalid primary color: ${primary}`)
        return
      }
      set({ primary })
      debouncedApplyTheme(get())
    },

    setSecondary: (secondary) => {
      if (!isValidColorName(secondary)) {
        console.warn(`Invalid secondary color: ${secondary}`)
        return
      }
      set({ secondary })
      debouncedApplyTheme(get())
    },

    setDestructive: (destructive) => {
      if (!isValidColorName(destructive)) {
        console.warn(`Invalid destructive color: ${destructive}`)
        return
      }
      set({ destructive })
      debouncedApplyTheme(get())
    },

    setBase: (base) => {
      if (!isValidColorName(base)) {
        console.warn(`Invalid base color: ${base}`)
        return
      }
      set({ base })
      debouncedApplyTheme(get())
    },

    setLayout: (layout) => {
      if (!isValidColorName(layout)) {
        console.warn(`Invalid layout color: ${layout}`)
        return
      }
      set({ layout })
      debouncedApplyTheme(get())
    },

    applyTheme: () => {
      const state = get()
      debouncedApplyTheme(state)
    },

    hydrate: () => {
      // This will be called after mount to ensure proper hydration
      // Use immediate application for hydration (no debounce)
      const state = get()
      applyTheme(state)

      // Mark theme as loaded to enable transitions
      requestAnimationFrame(() => {
        document.documentElement.classList.add('theme-loaded')
      })
    },
  }))
)

// Subscribe to all state changes and persist to cookies
useThemeStore.subscribe(
  (state) => ({
    mode: state.mode,
    primary: state.primary,
    secondary: state.secondary,
    destructive: state.destructive,
    base: state.base,
    layout: state.layout,
  }),
  (themeState) => {
    // Save to cookie with debouncing to prevent excessive writes
    debouncedSaveCookie(themeState)
  },
  {
    equalityFn: (a, b) =>
      a.mode === b.mode &&
      a.primary === b.primary &&
      a.secondary === b.secondary &&
      a.destructive === b.destructive &&
      a.base === b.base &&
      a.layout === b.layout,
  }
)
