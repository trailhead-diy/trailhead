// Color utilities for console output (similar to shell script color codes)
export const colors = {
  green: (text: string) => `\x1b[0;32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[1;33m${text}\x1b[0m`, 
  red: (text: string) => `\x1b[0;31m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[0;34m${text}\x1b[0m`
} as const

export const icons = {
  success: '✅',
  warning: '⚠️',
  error: '❌', 
  info: 'ℹ️',
  progress: '🔄',
  rocket: '🚀',
  package: '📦',
  search: '🔍',
  docs: '📚',
  stats: '📊',
  security: '🔒',
  ruler: '📏',
  money: '💰'
} as const

export function colorize(color: keyof typeof colors, text: string): string {
  return colors[color](text)
}

export function withIcon(icon: keyof typeof icons, text: string): string {
  return `${icons[icon]} ${text}`
}