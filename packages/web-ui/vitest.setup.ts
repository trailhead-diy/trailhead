import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import React from 'react'

// Mock animations API for Headless UI
mockAnimationsApi()

// Global console mock system for clean test output
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
}

// Mock console methods globally to silence test output
// Only restore if VITEST_CONSOLE_DEBUG environment variable is set
if (process.env.VITEST_CONSOLE_DEBUG !== 'true') {
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
  console.info = vi.fn()
}

// Export console utilities for tests that need console access
declare global {
  var __restoreConsole: () => void
  var __mockConsole: () => void
  var __originalConsole: typeof originalConsole
}

globalThis.__restoreConsole = () => {
  Object.assign(console, originalConsole)
}

globalThis.__mockConsole = () => {
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
  console.info = vi.fn()
}

globalThis.__originalConsole = originalConsole

// Mock next-themes with proper state management
vi.mock('next-themes', () => {
  let currentTheme = 'zinc'
  
  const setTheme = vi.fn((theme: string) => {
    currentTheme = theme
    if (document?.documentElement) {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  })

  return {
    useTheme: vi.fn(() => ({
      theme: currentTheme,
      setTheme,
      resolvedTheme: currentTheme,
      themes: ['light', 'dark', 'zinc', 'purple', 'green', 'orange', 'rose', 'violet'],
      systemTheme: 'light',
    })),
    ThemeProvider: ({ 
      children, 
      defaultTheme = 'zinc' 
    }: { 
      children: React.ReactNode
      defaultTheme?: string 
    }) => {
      React.useEffect(() => {
        currentTheme = defaultTheme
        if (document?.documentElement) {
          document.documentElement.setAttribute('data-theme', defaultTheme)
        }
      }, [defaultTheme])
      
      return children
    },
  }
})

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: () => any) => fn(),
}))

// Mock @npmcli/package-json for CLI tests
vi.mock('@npmcli/package-json', () => ({
  default: {
    load: vi.fn().mockResolvedValue({
      content: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {},
        devDependencies: {},
      },
      update: vi.fn(),
      save: vi.fn(),
    }),
  },
}))

// Mock ora spinner for CLI installation tests
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
    color: 'cyan',
    prefixText: '',
  })),
}))

// Essential browser API mocks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

// Pointer capture methods for better user interaction support
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  writable: true,
  value: vi.fn(() => false),
})

Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  writable: true,
  value: vi.fn(),
})

// PointerEvent shim for Headless UI
window.PointerEvent = MouseEvent as typeof PointerEvent

// Enhanced focus behavior for user interaction tests
Object.defineProperty(HTMLElement.prototype, 'focus', {
  writable: true,
  value: vi.fn(function (this: HTMLElement) {
    // Simulate real focus behavior
    Object.defineProperty(document, 'activeElement', {
      writable: true,
      configurable: true,
      value: this,
    })
    
    // Trigger focus event
    this.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    
    // Add visual focus indicators
    this.setAttribute('data-focused', 'true')
  }),
})

Object.defineProperty(HTMLElement.prototype, 'blur', {
  writable: true,
  value: vi.fn(function (this: HTMLElement) {
    // Simulate real blur behavior
    this.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    this.removeAttribute('data-focused')
  }),
})

// Enhanced scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Basic DOM cleanup between tests
beforeEach(() => {
  // Clear localStorage theme data
  localStorage.removeItem('theme')
  localStorage.removeItem('theme-storage')
})

afterEach(() => {
  cleanup()
  // Reset DOM attributes
  if (document?.documentElement) {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
  }
})