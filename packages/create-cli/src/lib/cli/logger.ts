/**
 * Logger utility helpers for consistent debug message formatting.
 *
 * Provides optimized formatting functions that avoid expensive JSON.stringify
 * operations while still providing useful debug output.
 *
 * @module cli/logger
 */

import type { Logger } from '@trailhead/cli/utils'

/**
 * Format object properties for debug logging without expensive JSON.stringify.
 *
 * Converts object entries to a compact key=value string representation,
 * truncating to maxProps entries for large objects.
 *
 * @param obj - Object with string keys to format
 * @param maxProps - Maximum number of properties to include (default: 5)
 * @returns Formatted string like "key1=value1, key2=value2"
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
 * Log template context information at debug level.
 *
 * @param logger - Logger instance for output
 * @param contextName - Descriptive name for the context (e.g., "Template context")
 * @param context - Context object to log (first 3 properties shown)
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
 * Log configuration information at debug level.
 *
 * @param logger - Logger instance for output
 * @param configName - Descriptive name for the config (e.g., "Generator config")
 * @param config - Configuration object to log (first 4 properties shown)
 */
export function debugConfig(logger: Logger, configName: string, config: Record<string, any>): void {
  const formatted = formatObjectForDebug(config, 4)
  logger.debug(`${configName}: ${formatted}`)
}

/**
 * Log error information at debug level with type-safe handling.
 *
 * Handles Error objects, strings, and unknown error types gracefully.
 *
 * @param logger - Logger instance for output
 * @param operation - Name of the operation that failed (e.g., "Template compilation")
 * @param error - Error object, string message, or unknown error type
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
 * Log statistics or metrics at debug level.
 *
 * Formats numeric/string stats as key=value pairs for easy parsing.
 *
 * @param logger - Logger instance for output
 * @param statsName - Descriptive name for the stats (e.g., "Cache stats")
 * @param stats - Object with numeric or string values
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
