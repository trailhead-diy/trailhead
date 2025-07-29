'use client'

import { useEffect } from 'react'
import { useThemeStore, setupSystemThemeListener, cleanupThemeTimers } from './store'

/**
 * Theme Initializer Component
 *
 * Simplified initializer that just ensures theme is applied on mount
 * and sets up system theme change listeners.
 *
 * Since we're using cookies, the initial state is already correct from the server.
 */
export function Initializer() {
  useEffect(() => {
    // Apply theme on mount to ensure DOM is in sync
    useThemeStore.getState().hydrate()

    // Setup global system theme listener
    const cleanup = setupSystemThemeListener()

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup()
      cleanupThemeTimers()
    }
  }, [])

  return null
}
