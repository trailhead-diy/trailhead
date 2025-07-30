/**
 * Cookie utilities for theme persistence
 * Provides SSR-safe theme storage that works on both server and client
 */

import type { ThemeState } from './types'
import { COLOR_NAMES, COLOR_MODES } from './constants'

const THEME_COOKIE_NAME = 'theme'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

/**
 * Serializes theme state for cookie storage
 */
function serializeTheme(state: ThemeState): string {
  return JSON.stringify({
    mode: state.mode,
    primary: state.primary,
    secondary: state.secondary,
    destructive: state.destructive,
    base: state.base,
    layout: state.layout,
  })
}

/**
 * Parses theme state from cookie value
 *
 * @param cookieValue - The raw cookie value to parse
 * @returns Parsed theme state if valid, null otherwise
 */
export function parseThemeCookie(cookieValue: string | undefined): ThemeState | null {
  if (!cookieValue) return null

  try {
    const parsed = JSON.parse(cookieValue) as ThemeState

    // Validate all required fields are present and valid
    if (
      parsed.mode &&
      parsed.primary &&
      parsed.secondary &&
      parsed.destructive &&
      parsed.base &&
      parsed.layout &&
      COLOR_MODES.includes(parsed.mode) &&
      COLOR_NAMES.includes(parsed.primary) &&
      COLOR_NAMES.includes(parsed.secondary) &&
      COLOR_NAMES.includes(parsed.destructive) &&
      COLOR_NAMES.includes(parsed.base) &&
      COLOR_NAMES.includes(parsed.layout)
    ) {
      return parsed
    }
  } catch {
    // Invalid JSON, return null
  }

  return null
}

/**
 * Sets theme cookie on the client
 */
export function setThemeCookie(state: ThemeState) {
  if (typeof document === 'undefined') return

  const value = serializeTheme(state)
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`
}

/**
 * Gets theme cookie value on the client
 */
export function getThemeCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined

  const cookies = document.cookie.split('; ')
  const themeCookie = cookies.find((cookie) => cookie.startsWith(`${THEME_COOKIE_NAME}=`))

  if (themeCookie) {
    return decodeURIComponent(themeCookie.split('=')[1])
  }

  return undefined
}

/**
 * Parses cookies from a cookie header string (for server-side)
 */
export function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  const cookies: Record<string, string> = {}
  cookieHeader.split('; ').forEach((cookie) => {
    const [name, value] = cookie.split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })

  return cookies
}

/**
 * Gets theme from cookie header (for server-side)
 */
export function getThemeFromCookieHeader(cookieHeader: string | null): ThemeState | null {
  const cookies = parseCookieHeader(cookieHeader)
  return parseThemeCookie(cookies[THEME_COOKIE_NAME])
}
