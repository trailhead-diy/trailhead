'use client'

import { useEffect, useState } from 'react'
import { Button } from './button'

export function SimpleModeToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Check localStorage or system preference on mount
    const stored = localStorage.getItem('color-mode')
    if (
      stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      setMode('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    setMode(newMode)

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
