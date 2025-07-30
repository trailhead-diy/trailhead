'use client'

import { useEffect, useState } from 'react'
import { Button } from '../button'

export function ModeToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Initialize theme on mount
    const stored = localStorage.getItem('color-mode')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    const currentMode =
      stored === 'dark' || stored === 'light'
        ? (stored as 'light' | 'dark')
        : systemPrefersDark
          ? 'dark'
          : 'light'

    setMode(currentMode)
    document.documentElement.classList.toggle('dark', currentMode === 'dark')

    // Only listen to system changes if no user preference is stored
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const userPreference = localStorage.getItem('color-mode')
      // Ignore system changes if user has set a preference
      if (userPreference) return

      const newMode = e.matches ? 'dark' : 'light'
      setMode(newMode)
      document.documentElement.classList.toggle('dark', newMode === 'dark')
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [])

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    setMode(newMode)
    console.log('new mode:', newMode)

    if (newMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    localStorage.setItem('color-mode', newMode)
  }

  return (
    <Button plain onClick={toggleMode}>
      {mode === 'light' ? '🌙' : '☀️'}
    </Button>
  )
}
