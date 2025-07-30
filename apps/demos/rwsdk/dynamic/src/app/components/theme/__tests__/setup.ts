import { beforeEach, vi } from 'vitest'

// Reset DOM between tests
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

  document.documentElement.className = ''
  document.documentElement.style.cssText = ''
  document.body.innerHTML = ''

  // Clear all cookies
  document.cookie.split(';').forEach((cookie) => {
    const [name] = cookie.split('=')
    if (name) {
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  })
})
