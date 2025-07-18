import { inspect } from 'node:util'

/**
 * Log levels supported by the logger, from least to most severe
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Logger interface for structured logging with optional data
 */
export interface Logger {
  /**
   * Log a debug message with optional contextual data
   * @param message - The debug message to log
   * @param data - Optional structured data to include with the log
   */
  debug(message: string, data?: unknown): void

  /**
   * Log an informational message with optional contextual data
   * @param message - The info message to log
   * @param data - Optional structured data to include with the log
   */
  info(message: string, data?: unknown): void

  /**
   * Log a warning message with optional contextual data
   * @param message - The warning message to log
   * @param data - Optional structured data to include with the log
   */
  warn(message: string, data?: unknown): void

  /**
   * Log an error message with optional contextual data
   * @param message - The error message to log
   * @param data - Optional structured data to include with the log (e.g., error object)
   */
  error(message: string, data?: unknown): void
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

function formatData(data: unknown): string {
  if (data === undefined) return ''
  return ' ' + inspect(data, { depth: 3, colors: true, compact: true })
}

/**
 * Creates a namespaced logger instance with environment-based configuration
 *
 * @param namespace - The namespace for this logger (e.g., "dependency-analysis:graph")
 * @returns A logger instance configured for the given namespace
 *
 * @remarks
 * The logger behavior is controlled by environment variables:
 * - `DEPENDENCY_ANALYSIS_DEBUG=true` - Enable all debug logging
 * - `DEPENDENCY_ANALYSIS_LOG_LEVEL=<level>` - Set minimum log level (debug, info, warn, error)
 * - `DEBUG=dependency-analysis` - Alternative way to enable debug logging
 *
 * @example
 * ```typescript
 * const logger = createLogger("myapp:module");
 * logger.info("Processing started", { fileCount: 10 });
 * logger.error("Failed to process", error);
 * ```
 */
export function createLogger(namespace: string): Logger {
  const minLevel = (process.env.DEPENDENCY_ANALYSIS_LOG_LEVEL as LogLevel) || 'info'
  const isEnabled =
    process.env.DEPENDENCY_ANALYSIS_DEBUG === 'true' ||
    process.env.DEBUG?.includes('dependency-analysis') ||
    false

  const log = (level: LogLevel, message: string, data?: unknown): void => {
    if (!isEnabled && level !== 'error') return
    if (!shouldLog(level, minLevel)) return

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${namespace}]`

    const output = `${prefix} ${message}${formatData(data)}`

    // eslint-disable-next-line no-console
    if (level === 'error') {
      // eslint-disable-next-line no-console
      console.error(output)
    } else if (level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(output)
    } else {
      // eslint-disable-next-line no-console
      console.log(output)
    }
  }

  return {
    debug: (message: string, data?: unknown) => log('debug', message, data),
    info: (message: string, data?: unknown) => log('info', message, data),
    warn: (message: string, data?: unknown) => log('warn', message, data),
    error: (message: string, data?: unknown) => log('error', message, data),
  }
}

/**
 * Pre-configured logger for dependency graph operations
 * @example
 * ```typescript
 * graphLogger.debug("Building dependency graph", { nodeCount: 42 });
 * ```
 */
export const graphLogger = createLogger('dependency-analysis:graph')

/**
 * Pre-configured logger for file grouping operations
 * @example
 * ```typescript
 * groupingLogger.info("Grouping complete", { groups: 5 });
 * ```
 */
export const groupingLogger = createLogger('dependency-analysis:grouping')

/**
 * Pre-configured logger for analysis engine operations
 * @example
 * ```typescript
 * analysisLogger.warn("Analysis taking longer than expected", { elapsed: 5000 });
 * ```
 */
export const analysisLogger = createLogger('dependency-analysis:analysis')

/**
 * Pre-configured logger for git integration operations
 * @example
 * ```typescript
 * gitLogger.error("Git operation failed", { command: "commit", error });
 * ```
 */
export const gitLogger = createLogger('dependency-analysis:git')
