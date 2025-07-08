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
 * @example
 * ```typescript
 * const logger = createDefaultLogger(true);
 * logger.info('Starting process...');
 * logger.success('Process completed!');
 * logger.debug('Debug info'); // Only shown if verbose=true
 * ```
 */
export function createDefaultLogger(verbose: boolean = false): Logger {
  return {
    info: (message: string) => console.log(message),
    success: (message: string) => console.log(chalk.green(`✓ ${message}`)),
    warning: (message: string) => console.log(chalk.yellow(`⚠ ${message}`)),
    error: (message: string) => console.log(chalk.red(`✗ ${message}`)),
    debug: (message: string) => {
      if (verbose) {
        console.log(chalk.gray(`🐛 ${message}`));
      }
    },
    step: (message: string) => console.log(chalk.blue(`→ ${message}`)),
  };
}

/**
 * Create silent logger that doesn't output anything
 * @returns Logger instance that suppresses all output
 * @example
 * ```typescript
 * const logger = createSilentLogger();
 * logger.info('This will not be displayed');
 * logger.error('Neither will this');
 * ```
 */
export function createSilentLogger(): Logger {
  return {
    info: () => {},
    success: () => {},
    warning: () => {},
    error: () => {},
    debug: () => {},
    step: () => {},
  };
}

/**
 * Create logger that adds prefix to all messages
 * @param prefix - Prefix to add to all messages
 * @param baseLogger - Base logger to wrap
 * @returns Logger instance with prefixed messages
 * @example
 * ```typescript
 * const base = createDefaultLogger();
 * const logger = createPrefixedLogger('BUILD', base);
 * logger.info('Starting'); // Outputs: [BUILD] Starting
 * ```
 */
export function createPrefixedLogger(prefix: string, baseLogger: Logger): Logger {
  return {
    info: (message: string) => baseLogger.info(`[${prefix}] ${message}`),
    success: (message: string) => baseLogger.success(`[${prefix}] ${message}`),
    warning: (message: string) => baseLogger.warning(`[${prefix}] ${message}`),
    error: (message: string) => baseLogger.error(`[${prefix}] ${message}`),
    debug: (message: string) => baseLogger.debug(`[${prefix}] ${message}`),
    step: (message: string) => baseLogger.step(`[${prefix}] ${message}`),
  };
}

/**
 * Create logger that collects all messages in memory
 * @returns Logger instance with collected messages array
 * @example
 * ```typescript
 * const logger = createCollectingLogger();
 * logger.info('test');
 * logger.error('error');
 * console.log(logger.messages.length); // 2
 * ```
 */
export function createCollectingLogger(): Logger & { messages: LogMessage[] } {
  const messages: LogMessage[] = [];

  return {
    messages,
    info: (message: string) => {
      messages.push({ level: 'info', message, timestamp: new Date() });
      console.log(message);
    },
    success: (message: string) => {
      messages.push({ level: 'success', message, timestamp: new Date() });
      console.log(chalk.green(`✓ ${message}`));
    },
    warning: (message: string) => {
      messages.push({ level: 'warning', message, timestamp: new Date() });
      console.log(chalk.yellow(`⚠ ${message}`));
    },
    error: (message: string) => {
      messages.push({ level: 'error', message, timestamp: new Date() });
      console.log(chalk.red(`✗ ${message}`));
    },
    debug: (message: string) => {
      messages.push({ level: 'debug', message, timestamp: new Date() });
    },
    step: (message: string) => {
      messages.push({ level: 'step', message, timestamp: new Date() });
      console.log(chalk.blue(`→ ${message}`));
    },
  };
}

/**
 * Log message structure for collecting logger
 */
export interface LogMessage {
  /** Log level/severity */
  level: 'info' | 'success' | 'warning' | 'error' | 'debug' | 'step';
  /** The log message content */
  message: string;
  /** When the message was logged */
  timestamp: Date;
}

/**
 * Format log messages for display or file output
 * @param messages - Array of log messages to format
 * @returns Array of formatted message strings
 * @example
 * ```typescript
 * const messages = [{ level: 'info', message: 'test', timestamp: new Date() }];
 * const formatted = formatLogMessages(messages);
 * // ['[2023-12-25T10:30:45.123Z] INFO    test']
 * ```
 */
export function formatLogMessages(messages: LogMessage[]): string[] {
  return messages.map(msg => {
    const timestamp = msg.timestamp.toISOString();
    const level = msg.level.toUpperCase().padEnd(7);
    return `[${timestamp}] ${level} ${msg.message}`;
  });
}

/**
 * Filter log messages by level
 * @param messages - Array of log messages to filter
 * @param levels - Array of levels to include
 * @returns Filtered array of log messages
 * @example
 * ```typescript
 * const messages = []; // various log messages
 * const errors = filterLogMessages(messages, ['error', 'warning']);
 * ```
 */
export function filterLogMessages(
  messages: LogMessage[],
  levels: LogMessage['level'][]
): LogMessage[] {
  return messages.filter(msg => levels.includes(msg.level));
}

/**
 * Create logger that writes to file and optionally to console
 * @param filePath - Path to log file
 * @param baseLogger - Optional base logger for console output
 * @returns Logger instance that writes to both file and console
 * @example
 * ```typescript
 * const logger = createFileLogger('./app.log');
 * logger.info('This goes to both console and file');
 *
 * // With silent console
 * const fileOnly = createFileLogger('./app.log', createSilentLogger());
 * ```
 */
export function createFileLogger(
  filePath: string,
  baseLogger: Logger = createDefaultLogger()
): Logger {
  const fs = require('fs');
  const stream = fs.createWriteStream(filePath, { flags: 'a' });

  const writeToFile = (level: string, message: string) => {
    const timestamp = new Date().toISOString();
    stream.write(`[${timestamp}] ${level.toUpperCase().padEnd(7)} ${message}\n`);
  };

  return {
    info: (message: string) => {
      baseLogger.info(message);
      writeToFile('info', message);
    },
    success: (message: string) => {
      baseLogger.success(message);
      writeToFile('success', message);
    },
    warning: (message: string) => {
      baseLogger.warning(message);
      writeToFile('warning', message);
    },
    error: (message: string) => {
      baseLogger.error(message);
      writeToFile('error', message);
    },
    debug: (message: string) => {
      baseLogger.debug(message);
      writeToFile('debug', message);
    },
    step: (message: string) => {
      baseLogger.step(message);
      writeToFile('step', message);
    },
  };
}
