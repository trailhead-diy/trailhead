/**
 * Console color utilities using picocolors
 * Provides lightweight, fast terminal color support
 */
import pc from 'picocolors'

// Re-export picocolors as the colors API
export { pc as colors }

// Export individual color functions for convenience
export const {
  red,
  green,
  yellow,
  blue,
  cyan,
  magenta,
  white,
  gray,
  bold,
  dim,
  underline,
  italic,
  strikethrough,
  reset,
} = pc
