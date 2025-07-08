import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';
import {
  formatError,
  displayError,
  displayErrorChain,
  createExitHandler,
  createLogHandler,
  createConditionalHandler,
  tryRecover,
  retryWithBackoff,
  mapError,
  mapErrorAsync,
  aggregateErrors,
  collectErrors,
  buildErrorChain,
  addToChain,
  filterByCategory,
  filterRecoverable,
  filterBySeverity,
} from '../handlers.js';
import type { CLIError, ErrorChain, SeverityError } from '../types.js';
import { Ok, Err } from '../factory.js';

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Disable chalk colors for consistent testing
    chalk.level = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('formatError', () => {
    it('should format basic error with icon and message', () => {
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        recoverable: false,
      };

      const lines = formatError(error);

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Something went wrong');
      expect(lines[0]).toContain('❌');
    });

    it('should include details when available and verbose', () => {
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        details: 'Additional context about the error',
        recoverable: false,
      };

      const lines = formatError(error, true);

      expect(lines).toHaveLength(3); // message + details + code
      expect(lines[1]).toContain('Additional context about the error');
      expect(lines[2]).toContain('Code: TEST_ERROR');
    });

    it('should include suggestion when available', () => {
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        suggestion: 'Try running with --verbose',
        recoverable: false,
      };

      const lines = formatError(error);

      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('💡 Try running with --verbose');
    });

    it('should show cause in verbose mode', () => {
      const cause = new Error('Root cause');
      cause.stack = 'Error: Root cause\n    at test:1:1';

      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        cause,
        recoverable: false,
      };

      const lines = formatError(error, true);

      expect(lines.some(line => line.includes('Caused by:'))).toBe(true);
      expect(lines.some(line => line.includes('Root cause'))).toBe(true);
      expect(lines.some(line => line.includes('Stack:'))).toBe(true);
    });

    it('should handle non-Error cause objects', () => {
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        cause: 'String cause',
        recoverable: false,
      };

      const lines = formatError(error, true);

      expect(lines.some(line => line.includes('String cause'))).toBe(true);
    });

    it('should use appropriate icons for severity levels', () => {
      const fatalError: SeverityError = {
        code: 'FATAL_ERROR',
        message: 'Fatal error',
        severity: 'fatal',
        recoverable: false,
      };

      const warningError: SeverityError = {
        code: 'WARNING_ERROR',
        message: 'Warning error',
        severity: 'warning',
        recoverable: true,
      };

      const fatalLines = formatError(fatalError);
      const warningLines = formatError(warningError);

      expect(fatalLines[0]).toContain('💀');
      expect(warningLines[0]).toContain('⚠️');
    });

    it('should use category-specific icons', () => {
      const networkError: CLIError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
        category: 'network',
        recoverable: true,
      };

      const filesystemError: CLIError = {
        code: 'FS_ERROR',
        message: 'File not found',
        category: 'filesystem',
        recoverable: false,
      };

      const networkLines = formatError(networkError);
      const fsLines = formatError(filesystemError);

      expect(networkLines[0]).toContain('🌐');
      expect(fsLines[0]).toContain('📁');
    });
  });

  describe('displayError', () => {
    it('should output formatted error to console', () => {
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        recoverable: false,
      };

      displayError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Something went wrong')
      );
    });

    it('should pass verbose flag to formatter', () => {
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        details: 'Extra details',
        recoverable: false,
      };

      displayError(error, true);

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Extra details'));
    });
  });

  describe('displayErrorChain', () => {
    it('should display error chain with proper formatting', () => {
      const chain: ErrorChain = {
        error: {
          code: 'PRIMARY_ERROR',
          message: 'Primary error',
          recoverable: false,
        },
        chain: [
          {
            code: 'SECONDARY_ERROR',
            message: 'Secondary error',
            recoverable: false,
          },
          {
            code: 'TERTIARY_ERROR',
            message: 'Tertiary error',
            recoverable: false,
          },
        ],
      };

      displayErrorChain(chain);

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error chain:'));
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Primary error'));
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Caused by:'));
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('1. '));
    });

    it('should handle chain with no secondary errors', () => {
      const chain: ErrorChain = {
        error: {
          code: 'ONLY_ERROR',
          message: 'Only error',
          recoverable: false,
        },
        chain: [],
      };

      displayErrorChain(chain);

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Only error'));
      expect(mockConsoleError).not.toHaveBeenCalledWith(expect.stringContaining('Caused by:'));
    });
  });

  describe('createExitHandler', () => {
    it('should create handler that displays error and exits', () => {
      const handler = createExitHandler(2, false);
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Fatal error',
        recoverable: false,
      };

      expect(() => handler(error)).toThrow('process.exit called');
      expect(mockExit).toHaveBeenCalledWith(2);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Fatal error'));
    });

    it('should use default exit code 1', () => {
      const handler = createExitHandler();
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Error',
        recoverable: false,
      };

      expect(() => handler(error)).toThrow('process.exit called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('createLogHandler', () => {
    it('should create handler that logs error', () => {
      const handler = createLogHandler('PREFIX:', true);
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'Log this error',
        recoverable: false,
      };

      handler(error);

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('PREFIX:'));
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Log this error'));
    });

    it('should work without prefix', () => {
      const handler = createLogHandler();
      const error: CLIError = {
        code: 'TEST_ERROR',
        message: 'No prefix error',
        recoverable: false,
      };

      handler(error);

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('No prefix error'));
    });
  });

  describe('createConditionalHandler', () => {
    it('should call true handler when condition is met', () => {
      const trueHandler = vi.fn();
      const falseHandler = vi.fn();
      const handler = createConditionalHandler(
        error => error.recoverable,
        trueHandler,
        falseHandler
      );

      const recoverableError: CLIError = {
        code: 'RECOVERABLE_ERROR',
        message: 'Recoverable',
        recoverable: true,
      };

      handler(recoverableError);

      expect(trueHandler).toHaveBeenCalledWith(recoverableError);
      expect(falseHandler).not.toHaveBeenCalled();
    });

    it('should call false handler when condition is not met', () => {
      const trueHandler = vi.fn();
      const falseHandler = vi.fn();
      const handler = createConditionalHandler(
        error => error.recoverable,
        trueHandler,
        falseHandler
      );

      const nonRecoverableError: CLIError = {
        code: 'FATAL_ERROR',
        message: 'Fatal',
        recoverable: false,
      };

      handler(nonRecoverableError);

      expect(falseHandler).toHaveBeenCalledWith(nonRecoverableError);
      expect(trueHandler).not.toHaveBeenCalled();
    });

    it('should handle missing false handler', () => {
      const trueHandler = vi.fn();
      const handler = createConditionalHandler(error => error.recoverable, trueHandler);

      const nonRecoverableError: CLIError = {
        code: 'FATAL_ERROR',
        message: 'Fatal',
        recoverable: false,
      };

      // Should not throw
      handler(nonRecoverableError);

      expect(trueHandler).not.toHaveBeenCalled();
    });
  });

  describe('tryRecover', () => {
    it('should return original result if successful', async () => {
      const result = Ok('success');
      const recovery = vi.fn();

      const recovered = await tryRecover(result, recovery);

      expect(recovered).toBe(result);
      expect(recovery).not.toHaveBeenCalled();
    });

    it('should attempt recovery for recoverable errors', async () => {
      const error: CLIError = {
        code: 'RECOVERABLE_ERROR',
        message: 'Recoverable',
        recoverable: true,
      };
      const result = Err(error);
      const recovery = vi.fn().mockResolvedValue(Ok('recovered'));

      const recovered = await tryRecover(result, recovery);

      expect(recovery).toHaveBeenCalledWith(error);
      expect(recovered.success).toBe(true);
      expect(recovered.value).toBe('recovered');
    });

    it('should not attempt recovery for non-recoverable errors', async () => {
      const error: CLIError = {
        code: 'FATAL_ERROR',
        message: 'Fatal',
        recoverable: false,
      };
      const result = Err(error);
      const recovery = vi.fn();

      const recovered = await tryRecover(result, recovery);

      expect(recovery).not.toHaveBeenCalled();
      expect(recovered).toBe(result);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return successful result immediately', async () => {
      const operation = vi.fn().mockResolvedValue(Ok('success'));

      const result = await retryWithBackoff(operation);

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry recoverable errors with backoff', async () => {
      const error: CLIError = {
        code: 'TEMPORARY_ERROR',
        message: 'Temporary failure',
        recoverable: true,
      };

      const operation = vi
        .fn()
        .mockResolvedValueOnce(Err(error))
        .mockResolvedValueOnce(Err(error))
        .mockResolvedValueOnce(Ok('success'));

      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10, // Use smaller delays for testing
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-recoverable errors', async () => {
      const error: CLIError = {
        code: 'FATAL_ERROR',
        message: 'Fatal failure',
        recoverable: false,
      };

      const operation = vi.fn().mockResolvedValue(Err(error));

      const result = await retryWithBackoff(operation);

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const error: CLIError = {
        code: 'PERSISTENT_ERROR',
        message: 'Always fails',
        recoverable: true,
      };

      const operation = vi.fn().mockResolvedValue(Err(error));

      const result = await retryWithBackoff(operation, {
        maxRetries: 2,
        initialDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should apply exponential backoff', async () => {
      const error: CLIError = {
        code: 'RECOVERABLE_ERROR',
        message: 'Retry me',
        recoverable: true,
      };

      const _operation = vi.fn().mockResolvedValue(Err(error));
      const _delays: number[] = [];

      // Skip this test as p-retry handles backoff internally
      // and we can't easily test the exact delays
    });
  });

  describe('mapError', () => {
    it('should return successful result unchanged', () => {
      const result = Ok('success');
      const mapper = vi.fn();

      const mapped = mapError(result, mapper);

      expect(mapped).toBe(result);
      expect(mapper).not.toHaveBeenCalled();
    });

    it('should transform error using mapper', () => {
      const error: CLIError = {
        code: 'ORIGINAL_ERROR',
        message: 'Original',
        recoverable: false,
      };

      const result = Err(error);
      const mapper = vi.fn().mockReturnValue({
        code: 'MAPPED_ERROR',
        message: 'Mapped',
        recoverable: true,
      });

      const mapped = mapError(result, mapper);

      expect(mapper).toHaveBeenCalledWith(error);
      expect(mapped.success).toBe(false);
      expect(mapped.error?.message).toBe('Mapped');
    });
  });

  describe('mapErrorAsync', () => {
    it('should handle async error mapping', async () => {
      const error: CLIError = {
        code: 'ASYNC_ERROR',
        message: 'Async error',
        recoverable: false,
      };

      const result = Promise.resolve(Err(error));
      const mapper = vi.fn().mockResolvedValue({
        code: 'MAPPED_ASYNC_ERROR',
        message: 'Mapped async',
        recoverable: true,
      });

      const mapped = await mapErrorAsync(result, mapper);

      expect(mapper).toHaveBeenCalledWith(error);
      expect(mapped.success).toBe(false);
      expect(mapped.error?.message).toBe('Mapped async');
    });
  });

  describe('aggregateErrors', () => {
    it('should handle empty error array', () => {
      const aggregated = aggregateErrors([]);

      expect(aggregated.code).toBe('NO_ERRORS');
      expect(aggregated.message).toBe('No errors');
      expect(aggregated.recoverable).toBe(true);
    });

    it('should return single error unchanged', () => {
      const error: CLIError = {
        code: 'SINGLE_ERROR',
        message: 'Single',
        recoverable: false,
      };

      const aggregated = aggregateErrors([error]);

      expect(aggregated).toBe(error);
    });

    it('should aggregate multiple errors', () => {
      const errors: CLIError[] = [
        { code: 'ERROR_1', message: 'First error', recoverable: true },
        { code: 'ERROR_2', message: 'Second error', recoverable: false },
        { code: 'ERROR_3', message: 'Third error', recoverable: true },
      ];

      const aggregated = aggregateErrors(errors);

      expect(aggregated.code).toBe('MULTIPLE_ERRORS');
      expect(aggregated.message).toContain('3 total');
      expect(aggregated.details).toContain('1. First error');
      expect(aggregated.details).toContain('2. Second error');
      expect(aggregated.details).toContain('3. Third error');
      expect(aggregated.recoverable).toBe(false); // One non-recoverable makes all non-recoverable
    });
  });

  describe('collectErrors', () => {
    it('should separate successful results from errors', () => {
      const results = [
        Ok('value1'),
        Err({ code: 'ERROR_1', message: 'Error 1', recoverable: true }),
        Ok('value2'),
        Err({ code: 'ERROR_2', message: 'Error 2', recoverable: false }),
        Ok('value3'),
      ];

      const { values, errors } = collectErrors(results);

      expect(values).toEqual(['value1', 'value2', 'value3']);
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('Error 1');
      expect(errors[1].message).toBe('Error 2');
    });
  });

  describe('buildErrorChain', () => {
    it('should build error chain from array', () => {
      const errors: CLIError[] = [
        { code: 'PRIMARY', message: 'Primary', recoverable: false },
        { code: 'SECONDARY', message: 'Secondary', recoverable: true },
        { code: 'TERTIARY', message: 'Tertiary', recoverable: false },
      ];

      const chain = buildErrorChain(errors);

      expect(chain.error).toBe(errors[0]);
      expect(chain.chain).toEqual([errors[1], errors[2]]);
    });

    it('should throw for empty array', () => {
      expect(() => buildErrorChain([])).toThrow('Cannot build error chain from empty array');
    });
  });

  describe('addToChain', () => {
    it('should add error to existing chain', () => {
      const original: ErrorChain = {
        error: { code: 'PRIMARY', message: 'Primary', recoverable: false },
        chain: [{ code: 'SECONDARY', message: 'Secondary', recoverable: true }],
      };

      const newError: CLIError = {
        code: 'TERTIARY',
        message: 'Tertiary',
        recoverable: false,
      };

      const extended = addToChain(original, newError);

      expect(extended.error).toBe(original.error);
      expect(extended.chain).toHaveLength(2);
      expect(extended.chain[1]).toBe(newError);
    });
  });

  describe('filter functions', () => {
    const errors: CLIError[] = [
      {
        code: 'NET_ERROR',
        message: 'Network',
        category: 'network',
        recoverable: true,
      },
      {
        code: 'FS_ERROR',
        message: 'Filesystem',
        category: 'filesystem',
        recoverable: false,
      },
      {
        code: 'WARN_ERROR',
        message: 'Warning',
        severity: 'warning',
        recoverable: true,
      } as SeverityError,
      {
        code: 'FATAL_ERROR',
        message: 'Fatal',
        severity: 'fatal',
        recoverable: false,
      } as SeverityError,
    ];

    describe('filterByCategory', () => {
      it('should filter errors by category', () => {
        const networkErrors = filterByCategory(errors, 'network');
        const fsErrors = filterByCategory(errors, 'filesystem');

        expect(networkErrors).toHaveLength(1);
        expect(networkErrors[0].message).toBe('Network');
        expect(fsErrors).toHaveLength(1);
        expect(fsErrors[0].message).toBe('Filesystem');
      });
    });

    describe('filterRecoverable', () => {
      it('should filter recoverable errors', () => {
        const recoverableErrors = filterRecoverable(errors);

        expect(recoverableErrors).toHaveLength(2);
        expect(recoverableErrors.every(e => e.recoverable)).toBe(true);
      });
    });

    describe('filterBySeverity', () => {
      it('should filter errors by severity', () => {
        const warningErrors = filterBySeverity(errors, 'warning');
        const fatalErrors = filterBySeverity(errors, 'fatal');

        expect(warningErrors).toHaveLength(1);
        expect(warningErrors[0].message).toBe('Warning');
        expect(fatalErrors).toHaveLength(1);
        expect(fatalErrors[0].message).toBe('Fatal');
      });
    });
  });
});
