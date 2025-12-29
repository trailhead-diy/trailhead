import { log } from '@clack/prompts'
import { gray } from './chalk.js'

/**
 * Logger interface for consistent CLI output
 * Using Clack's log API for beautiful, consistent terminal output
 */
export interface Logger {
  /** Log informational messages */
  info: (message: string) => void
  /** Log success messages with checkmark */
  success: (message: string) => void
  /** Log warning messages with warning symbol */
  warning: (message: string) => void
  /** Log error messages with error symbol */
  error: (message: string, error?: unknown) => void
  /** Log debug messages (only shown in verbose mode) */
  debug: (message: string) => void
  /** Log step/progress messages with arrow */
  step: (message: string) => void
}

/**
 * Create default console logger with colored output
 *
 * Creates a logger instance using Clack's log API with colored formatting
 * and optional debug message support. Provides consistent cross-platform output.
 *
 * @param verbose - Whether to show debug messages (defaults to false)
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
export function createDefaultLogger(verbose = false): Logger {
  return {
    info: (message) => log.info(message),
    success: (message) => log.success(message),
    warning: (message) => log.warn(message),
    error: (message, error) => {
      const errorMessage = error ? `${message}: ${String(error)}` : message
      log.error(errorMessage)
    },
    debug: (message) => {
      if (verbose) {
        log.message(gray(message), { symbol: gray('·') })
      }
    },
    step: (message) => log.step(message),
  }
}

/**
 * Default logger instance for convenience.
 *
 * Uses non-verbose mode. Create a custom logger with createDefaultLogger()
 * if you need verbose debug output.
 */
export const logger = createDefaultLogger()
