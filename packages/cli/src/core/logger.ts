import chalk from 'chalk';

export interface Logger {
  info: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
  step: (message: string) => void;
}

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

export function createPrefixedLogger(
  prefix: string,
  baseLogger: Logger,
): Logger {
  return {
    info: (message: string) => baseLogger.info(`[${prefix}] ${message}`),
    success: (message: string) => baseLogger.success(`[${prefix}] ${message}`),
    warning: (message: string) => baseLogger.warning(`[${prefix}] ${message}`),
    error: (message: string) => baseLogger.error(`[${prefix}] ${message}`),
    debug: (message: string) => baseLogger.debug(`[${prefix}] ${message}`),
    step: (message: string) => baseLogger.step(`[${prefix}] ${message}`),
  };
}

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

export interface LogMessage {
  level: 'info' | 'success' | 'warning' | 'error' | 'debug' | 'step';
  message: string;
  timestamp: Date;
}

export function formatLogMessages(messages: LogMessage[]): string[] {
  return messages.map((msg) => {
    const timestamp = msg.timestamp.toISOString();
    const level = msg.level.toUpperCase().padEnd(7);
    return `[${timestamp}] ${level} ${msg.message}`;
  });
}

export function filterLogMessages(
  messages: LogMessage[],
  levels: LogMessage['level'][],
): LogMessage[] {
  return messages.filter((msg) => levels.includes(msg.level));
}

export function createFileLogger(
  filePath: string,
  baseLogger: Logger = createDefaultLogger(),
): Logger {
  const fs = require('fs');
  const stream = fs.createWriteStream(filePath, { flags: 'a' });

  const writeToFile = (level: string, message: string) => {
    const timestamp = new Date().toISOString();
    stream.write(
      `[${timestamp}] ${level.toUpperCase().padEnd(7)} ${message}\n`,
    );
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

export const createLogger = createDefaultLogger;
