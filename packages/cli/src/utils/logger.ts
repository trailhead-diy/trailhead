import chalk from 'chalk';

/**
 * Logger interface for consistent CLI output
 */
export interface Logger {
  /** Log informational messages */
  info: (message: string) => void;
  /** Log success messages with checkmark */
  success: (message: string) => void;
  /** Log warning messages with warning symbol */
  warning: (message: string) => void;
  /** Log error messages with error symbol */
  error: (message: string) => void;
  /** Log debug messages (only shown in verbose mode) */
  debug: (message: string) => void;
  /** Log step/progress messages with arrow */
  step: (message: string) => void;
}

/**
 * Create default console logger with colored output
 * @param verbose - Whether to show debug messages
 * @returns Logger instance that outputs to console
 */
export function createDefaultLogger(verbose = false): Logger {
  return {
    info: (message: string) => console.log(chalk.blue('ℹ'), message),
    success: (message: string) => console.log(chalk.green('✓'), message),
    warning: (message: string) => console.warn(chalk.yellow('⚠'), message),
    error: (message: string) => console.error(chalk.red('✗'), message),
    debug: (message: string) => {
      if (verbose) {
        console.log(chalk.gray('→'), chalk.gray(message));
      }
    },
    step: (message: string) => console.log(chalk.cyan('→'), message),
  };
}
