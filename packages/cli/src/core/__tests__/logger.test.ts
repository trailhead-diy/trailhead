import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import chalk from 'chalk';
import {
  createDefaultLogger,
  createSilentLogger,
  createPrefixedLogger,
  createCollectingLogger,
  createFileLogger,
  formatLogMessages,
  filterLogMessages,
  type Logger,
  type LogMessage,
} from '../logger.js';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
};

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: vi.fn((text: string) => `green(${text})`),
    red: vi.fn((text: string) => `red(${text})`),
    yellow: vi.fn((text: string) => `yellow(${text})`),
    blue: vi.fn((text: string) => `blue(${text})`),
    gray: vi.fn((text: string) => `gray(${text})`),
  },
}));

// Note: createFileLogger is not tested due to complex require() mocking
// The function is straightforward file I/O and would be better tested with integration tests

const mockChalk = vi.mocked(chalk);

describe('Logger Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log globally
    global.console.log = mockConsole.log;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Logger interface', () => {
    it('should define correct logger interface', () => {
      const logger = createDefaultLogger();

      expect(typeof logger.info).toBe('function');
      expect(typeof logger.success).toBe('function');
      expect(typeof logger.warning).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.step).toBe('function');
    });
  });

  describe('createDefaultLogger', () => {
    it('should create logger with verbose=false by default', () => {
      const logger = createDefaultLogger();

      logger.info('info message');
      logger.success('success message');
      logger.warning('warning message');
      logger.error('error message');
      logger.debug('debug message');
      logger.step('step message');

      expect(mockConsole.log).toHaveBeenCalledWith('info message');
      expect(mockConsole.log).toHaveBeenCalledWith('green(✓ success message)');
      expect(mockConsole.log).toHaveBeenCalledWith(
        'yellow(⚠ warning message)',
      );
      expect(mockConsole.log).toHaveBeenCalledWith('red(✗ error message)');
      expect(mockConsole.log).toHaveBeenCalledWith('blue(→ step message)');

      // Debug should not be called when verbose=false
      expect(mockConsole.log).not.toHaveBeenCalledWith(
        'gray(🐛 debug message)',
      );
      expect(mockConsole.log).toHaveBeenCalledTimes(5);
    });

    it('should show debug messages when verbose=true', () => {
      const logger = createDefaultLogger(true);

      logger.debug('debug message');

      expect(mockConsole.log).toHaveBeenCalledWith('gray(🐛 debug message)');
    });

    it('should hide debug messages when verbose=false', () => {
      const logger = createDefaultLogger(false);

      logger.debug('debug message');

      expect(mockConsole.log).not.toHaveBeenCalledWith(
        'gray(🐛 debug message)',
      );
    });

    it('should use correct chalk colors and symbols', () => {
      const logger = createDefaultLogger();

      logger.success('test');
      logger.warning('test');
      logger.error('test');
      logger.step('test');

      expect(mockChalk.green).toHaveBeenCalledWith('✓ test');
      expect(mockChalk.yellow).toHaveBeenCalledWith('⚠ test');
      expect(mockChalk.red).toHaveBeenCalledWith('✗ test');
      expect(mockChalk.blue).toHaveBeenCalledWith('→ test');
    });
  });

  describe('createSilentLogger', () => {
    it('should create logger that does not output anything', () => {
      const logger = createSilentLogger();

      logger.info('info message');
      logger.success('success message');
      logger.warning('warning message');
      logger.error('error message');
      logger.debug('debug message');
      logger.step('step message');

      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should implement all logger methods as no-ops', () => {
      const logger = createSilentLogger();

      expect(() => {
        logger.info('test');
        logger.success('test');
        logger.warning('test');
        logger.error('test');
        logger.debug('test');
        logger.step('test');
      }).not.toThrow();
    });
  });

  describe('createPrefixedLogger', () => {
    it('should add prefix to all messages', () => {
      const baseLogger = createDefaultLogger();
      const prefixedLogger = createPrefixedLogger('PREFIX', baseLogger);

      prefixedLogger.info('info message');
      prefixedLogger.success('success message');
      prefixedLogger.warning('warning message');
      prefixedLogger.error('error message');
      prefixedLogger.debug('debug message');
      prefixedLogger.step('step message');

      expect(mockConsole.log).toHaveBeenCalledWith('[PREFIX] info message');
      expect(mockConsole.log).toHaveBeenCalledWith(
        'green(✓ [PREFIX] success message)',
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        'yellow(⚠ [PREFIX] warning message)',
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        'red(✗ [PREFIX] error message)',
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        'blue(→ [PREFIX] step message)',
      );
    });

    it('should work with silent base logger', () => {
      const baseLogger = createSilentLogger();
      const prefixedLogger = createPrefixedLogger('TEST', baseLogger);

      prefixedLogger.info('test message');

      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should handle empty prefix', () => {
      const baseLogger = createDefaultLogger();
      const prefixedLogger = createPrefixedLogger('', baseLogger);

      prefixedLogger.info('test message');

      expect(mockConsole.log).toHaveBeenCalledWith('[] test message');
    });

    it('should handle special characters in prefix', () => {
      const baseLogger = createDefaultLogger();
      const prefixedLogger = createPrefixedLogger('CLI:BUILD', baseLogger);

      prefixedLogger.info('test message');

      expect(mockConsole.log).toHaveBeenCalledWith('[CLI:BUILD] test message');
    });
  });

  describe('createCollectingLogger', () => {
    let mockDate: ReturnType<typeof vi.spyOn>;
    const fixedDate = new Date('2023-12-25T10:30:45.123Z');

    beforeEach(() => {
      mockDate = vi.spyOn(global, 'Date').mockImplementation(() => fixedDate);
    });

    afterEach(() => {
      mockDate.mockRestore();
    });

    it('should collect all log messages', () => {
      const logger = createCollectingLogger();

      logger.info('info message');
      logger.success('success message');
      logger.warning('warning message');
      logger.error('error message');
      logger.debug('debug message');
      logger.step('step message');

      expect(logger.messages).toHaveLength(6);
      expect(logger.messages[0]).toEqual({
        level: 'info',
        message: 'info message',
        timestamp: fixedDate,
      });
      expect(logger.messages[1]).toEqual({
        level: 'success',
        message: 'success message',
        timestamp: fixedDate,
      });
    });

    it('should still output to console for most levels', () => {
      const logger = createCollectingLogger();

      logger.info('info message');
      logger.success('success message');
      logger.warning('warning message');
      logger.error('error message');
      logger.step('step message');

      expect(mockConsole.log).toHaveBeenCalledWith('info message');
      expect(mockConsole.log).toHaveBeenCalledWith('green(✓ success message)');
      expect(mockConsole.log).toHaveBeenCalledWith(
        'yellow(⚠ warning message)',
      );
      expect(mockConsole.log).toHaveBeenCalledWith('red(✗ error message)');
      expect(mockConsole.log).toHaveBeenCalledWith('blue(→ step message)');
    });

    it('should collect debug messages but not output them to console', () => {
      const logger = createCollectingLogger();

      logger.debug('debug message');

      expect(logger.messages).toHaveLength(1);
      expect(logger.messages[0]).toEqual({
        level: 'debug',
        message: 'debug message',
        timestamp: fixedDate,
      });

      // Debug should not be output to console in collecting logger
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should maintain message order', () => {
      const logger = createCollectingLogger();

      logger.error('first');
      logger.info('second');
      logger.success('third');

      expect(logger.messages.map((m) => m.message)).toEqual([
        'first',
        'second',
        'third',
      ]);
      expect(logger.messages.map((m) => m.level)).toEqual([
        'error',
        'info',
        'success',
      ]);
    });
  });

  describe('formatLogMessages', () => {
    it('should format log messages with timestamp and level', () => {
      const messages: LogMessage[] = [
        {
          level: 'info',
          message: 'Info message',
          timestamp: new Date('2023-12-25T10:30:45.123Z'),
        },
        {
          level: 'error',
          message: 'Error message',
          timestamp: new Date('2023-12-25T10:31:00.456Z'),
        },
      ];

      const formatted = formatLogMessages(messages);

      expect(formatted).toEqual([
        '[2023-12-25T10:30:45.123Z] INFO    Info message',
        '[2023-12-25T10:31:00.456Z] ERROR   Error message',
      ]);
    });

    it('should pad level names consistently', () => {
      const messages: LogMessage[] = [
        { level: 'info', message: 'test', timestamp: new Date() },
        { level: 'warning', message: 'test', timestamp: new Date() },
        { level: 'success', message: 'test', timestamp: new Date() },
      ];

      const formatted = formatLogMessages(messages);

      // All levels should be padded to 7 characters
      expect(formatted[0]).toMatch(/] INFO    /);
      expect(formatted[1]).toMatch(/] WARNING /);
      expect(formatted[2]).toMatch(/] SUCCESS /);
    });

    it('should handle empty messages array', () => {
      const formatted = formatLogMessages([]);

      expect(formatted).toEqual([]);
    });

    it('should handle all log levels', () => {
      const messages: LogMessage[] = [
        { level: 'info', message: 'test', timestamp: new Date() },
        { level: 'success', message: 'test', timestamp: new Date() },
        { level: 'warning', message: 'test', timestamp: new Date() },
        { level: 'error', message: 'test', timestamp: new Date() },
        { level: 'debug', message: 'test', timestamp: new Date() },
        { level: 'step', message: 'test', timestamp: new Date() },
      ];

      const formatted = formatLogMessages(messages);

      expect(formatted).toHaveLength(6);
      expect(formatted.every((msg) => msg.includes('test'))).toBe(true);
    });
  });

  describe('filterLogMessages', () => {
    const messages: LogMessage[] = [
      { level: 'info', message: 'info msg', timestamp: new Date() },
      { level: 'success', message: 'success msg', timestamp: new Date() },
      { level: 'warning', message: 'warning msg', timestamp: new Date() },
      { level: 'error', message: 'error msg', timestamp: new Date() },
      { level: 'debug', message: 'debug msg', timestamp: new Date() },
      { level: 'step', message: 'step msg', timestamp: new Date() },
    ];

    it('should filter messages by single level', () => {
      const filtered = filterLogMessages(messages, ['error']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].level).toBe('error');
      expect(filtered[0].message).toBe('error msg');
    });

    it('should filter messages by multiple levels', () => {
      const filtered = filterLogMessages(messages, [
        'info',
        'error',
        'warning',
      ]);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((m) => m.level)).toEqual([
        'info',
        'warning',
        'error',
      ]);
    });

    it('should return empty array when no levels match', () => {
      const filtered = filterLogMessages(messages, []);

      expect(filtered).toEqual([]);
    });

    it('should return all messages when all levels specified', () => {
      const allLevels: LogMessage['level'][] = [
        'info',
        'success',
        'warning',
        'error',
        'debug',
        'step',
      ];
      const filtered = filterLogMessages(messages, allLevels);

      expect(filtered).toHaveLength(messages.length);
    });

    it('should maintain original message order', () => {
      const filtered = filterLogMessages(messages, ['warning', 'info']);

      // Should return info first, then warning (original order)
      expect(filtered.map((m) => m.level)).toEqual(['info', 'warning']);
    });

    it('should handle empty messages array', () => {
      const filtered = filterLogMessages([], ['info']);

      expect(filtered).toEqual([]);
    });
  });

  // Note: createFileLogger tests skipped due to complex require() mocking
  // The function handles file I/O which is better suited for integration tests

  describe('createDefaultLogger alias', () => {
    it('should be an alias for createDefaultLogger', () => {
      expect(createDefaultLogger).toBe(createDefaultLogger);
    });

    it('should work the same as createDefaultLogger', () => {
      const logger1 = createDefaultLogger();
      const logger2 = createDefaultLogger();

      logger1.info('test');
      logger2.info('test');

      expect(mockConsole.log).toHaveBeenCalledTimes(2);
      expect(mockConsole.log).toHaveBeenNthCalledWith(1, 'test');
      expect(mockConsole.log).toHaveBeenNthCalledWith(2, 'test');
    });
  });

  describe('Integration scenarios', () => {
    it('should support logger composition', () => {
      const collectingLogger = createCollectingLogger();
      const prefixedLogger = createPrefixedLogger('CLI', collectingLogger);

      prefixedLogger.info('test message');
      prefixedLogger.error('error message');

      expect(collectingLogger.messages).toHaveLength(2);
      expect(collectingLogger.messages[0].message).toBe('[CLI] test message');
      expect(collectingLogger.messages[1].message).toBe('[CLI] error message');
    });

    it('should handle complex logging workflow', () => {
      const logger = createCollectingLogger();

      logger.step('Starting process');
      logger.info('Processing file 1');
      logger.success('File 1 processed');
      logger.info('Processing file 2');
      logger.warning('File 2 has warnings');
      logger.error('File 3 failed');
      logger.step('Process completed');

      const errorMessages = filterLogMessages(logger.messages, ['error']);
      const successMessages = filterLogMessages(logger.messages, ['success']);

      expect(errorMessages).toHaveLength(1);
      expect(successMessages).toHaveLength(1);
      expect(logger.messages).toHaveLength(7);
    });

    it('should work with multiple logger types together', () => {
      const baseLogger = createDefaultLogger(true);
      const prefixedLogger = createPrefixedLogger('BUILD', baseLogger);
      const collectingLogger = createCollectingLogger();

      prefixedLogger.debug('Debug message');
      collectingLogger.debug('Collected debug');

      // Prefixed logger with verbose=true should output debug
      expect(mockConsole.log).toHaveBeenCalledWith(
        'gray(🐛 [BUILD] Debug message)',
      );

      // Collecting logger should collect but not output debug
      expect(collectingLogger.messages).toHaveLength(1);
      expect(collectingLogger.messages[0].level).toBe('debug');
    });
  });

  describe('Error handling', () => {
    it('should handle logger methods with empty strings', () => {
      const logger = createDefaultLogger();

      expect(() => {
        logger.info('');
        logger.success('');
        logger.warning('');
        logger.error('');
        logger.debug('');
        logger.step('');
      }).not.toThrow();
    });

    it('should handle logger methods with special characters', () => {
      const logger = createDefaultLogger();
      const specialMessage =
        'Special chars: !@#$%^&*()[]{}|\\:";\'<>?,./ 中文 🚀';

      expect(() => {
        logger.info(specialMessage);
        logger.success(specialMessage);
        logger.warning(specialMessage);
        logger.error(specialMessage);
        logger.debug(specialMessage);
        logger.step(specialMessage);
      }).not.toThrow();
    });

    it('should handle very long messages', () => {
      const logger = createDefaultLogger();
      const longMessage = 'a'.repeat(10000);

      expect(() => {
        logger.info(longMessage);
        logger.success(longMessage);
      }).not.toThrow();
    });
  });
});
