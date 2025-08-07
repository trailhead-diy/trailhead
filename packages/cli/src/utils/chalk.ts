/**
 * Console utilities using consola
 * Provides structured logging with colors and formatting
 */
import { consola } from 'consola'

// Export consola instance and common logging methods
export { consola }

// Structured logging methods (recommended approach)
export const logSuccess = (message: string, ...args: unknown[]) => consola.success(message, ...args)
export const logError = (message: string, ...args: unknown[]) => consola.error(message, ...args)
export const logWarning = (message: string, ...args: unknown[]) => consola.warn(message, ...args)
export const logInfo = (message: string, ...args: unknown[]) => consola.info(message, ...args)
export const log = (message: string, ...args: unknown[]) => consola.log(message, ...args)

// For cases where raw colors are still needed, export them directly
// But prefer using consola methods above
export { colors } from 'consola/utils'
