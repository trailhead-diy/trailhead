/**
 * Logger utility helpers for consistent debug message formatting
 * Provides optimized formatting functions to avoid expensive operations
 */

import type { Logger } from '@trailhead/cli/utils'

/**
 * Format object properties for debug logging without expensive JSON.stringify
 * @param obj - Object to format
 * @param maxProps - Maximum number of properties to show (default: 5)
 * @returns Formatted string representation
 */
export function formatObjectForDebug(obj: Record<string, any>, maxProps: number = 5): string {
  const entries = Object.entries(obj).slice(0, maxProps)
  return entries
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        return `${key}=${value}`
      } else if (value === null || value === undefined) {
        return `${key}=${value}`
      } else {
        return `${key}=[object]`
      }
    })
    .join(', ')
}

/**
 * Debug log template context information
 * @param logger - Logger instance
 * @param contextName - Name of the context being logged
 * @param context - Context object to log
 */
export function debugTemplateContext(
  logger: Logger,
  contextName: string,
  context: Record<string, any>
): void {
  const formatted = formatObjectForDebug(context, 3)
  logger.debug(`${contextName}: ${formatted}`)
}

/**
 * Debug log configuration information
 * @param logger - Logger instance
 * @param configName - Name of the configuration
 * @param config - Configuration object to log
 */
export function debugConfig(logger: Logger, configName: string, config: Record<string, any>): void {
  const formatted = formatObjectForDebug(config, 4)
  logger.debug(`${configName}: ${formatted}`)
}

/**
 * Debug log error information with proper formatting
 * @param logger - Logger instance
 * @param operation - Operation that failed
 * @param error - Error object or message
 */
export function debugError(
  logger: Logger,
  operation: string,
  error: Error | string | unknown
): void {
  if (error instanceof Error) {
    logger.debug(`${operation} error: ${error.message}`)
  } else if (typeof error === 'string') {
    logger.debug(`${operation} error: ${error}`)
  } else {
    logger.debug(`${operation} error: Unknown error type`)
  }
}

/**
 * Debug log statistics or metrics
 * @param logger - Logger instance
 * @param statsName - Name of the statistics
 * @param stats - Statistics object
 */
export function debugStats(
  logger: Logger,
  statsName: string,
  stats: Record<string, number | string>
): void {
  const formatted = Object.entries(stats)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
  logger.debug(`${statsName}: ${formatted}`)
}
