// Color utilities for console output using consola
import { colors as consolaColors } from 'consola/utils'

export const colors = {
  green: consolaColors.green,
  yellow: consolaColors.yellow,
  red: consolaColors.red,
  blue: consolaColors.blue,
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
  money: '💰',
} as const

export function colorize(color: keyof typeof colors, text: string): string {
  return colors[color](text)
}

export function withIcon(icon: keyof typeof icons, text: string): string {
  return `${icons[icon]} ${text}`
}
