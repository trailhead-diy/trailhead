import { createConsola, type ConsolaInstance } from 'consola'

/**
 * Logger interface for consistent CLI output
 * Using consola for cross-platform colored output and better control
 */
export interface Logger {
  /** Log informational messages */
  info: (message: string, ...args: unknown[]) => void
  /** Log success messages with checkmark */
  success: (message: string, ...args: unknown[]) => void
  /** Log warning messages with warning symbol */
  warning: (message: string, ...args: unknown[]) => void
  /** Log error messages with error symbol */
  error: (message: string, error?: unknown) => void
  /** Log debug messages (only shown in verbose mode) */
  debug: (message: string, ...args: unknown[]) => void
  /** Log step/progress messages with arrow */
  step: (message: string, ...args: unknown[]) => void
  /** Raw consola instance for advanced usage */
  readonly raw: ConsolaInstance
}

/**
 * Create default console logger with colored output
 *
 * Creates a logger instance using consola with colored formatting
 * and optional debug message support. Provides consistent cross-platform output.
 *
 * @param verbose - Whether to show debug messages (defaults to false)
 * @param tag - Optional tag for scoped logging
 * @returns Logger instance that outputs to console with colored formatting
 *
 * @example
 * ```typescript
 * const logger = createDefaultLogger(true);
 * logger.info('Starting application...');
 * logger.success('Build completed successfully');
 * logger.error('Build failed', error);
 * logger.debug('Debug info'); // Only shown if verbose=true
 * ```
 */
export function createDefaultLogger(verbose = false, tag?: string): Logger {
  const consolaInstance = createConsola({
    level: verbose ? 4 : 3, // 4 = debug, 3 = info
  })

  const logger = tag ? consolaInstance.withTag(tag) : consolaInstance

  return {
    info: (message, ...args) => logger.info(message, ...args),
    success: (message, ...args) => logger.success(message, ...args),
    warning: (message, ...args) => logger.warn(message, ...args),
    error: (message, error) => (error ? logger.error(message, error) : logger.error(message)),
    debug: (message, ...args) => logger.debug(message, ...args),
    step: (message, ...args) => logger.start(message, ...args),
    raw: logger,
  }
}

/**
 * Export a default logger instance for convenience
 */
export const logger = createDefaultLogger()
