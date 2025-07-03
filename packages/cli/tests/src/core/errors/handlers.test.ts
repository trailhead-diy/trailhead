import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';
import {
  displayError,
  formatError,
  createExitHandler,
  retryWithBackoff,
  tryRecover,
  createError,
  type CLIError,
} from '@esteban-url/trailhead-cli/core';

describe('Error Handlers', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    chalk.level = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User-Facing Error Display', () => {
    it('should display errors with helpful suggestions', () => {
      const error: CLIError = {
        code: 'MISSING_DEPENDENCY',
        message: 'Required package not found',
        suggestion: 'Run npm install to install dependencies',
        recoverable: true,
      };

      displayError(error, false);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Required package not found'),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run npm install'),
      );
    });

    it('should show stack trace in verbose mode for debugging', () => {
      const error: CLIError = {
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong',
        recoverable: false,
        cause: new Error('Root cause'),
      };

      displayError(error, true);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Root cause'),
      );
    });

    it('should format nested errors properly', () => {
      const rootCause = new Error('Database connection failed');
      const error: CLIError = {
        code: 'CONNECTION_ERROR',
        message: 'Failed to connect to service',
        cause: rootCause,
        recoverable: false,
      };

      const formatted = formatError(error, true); // verbose mode to show cause

      expect(formatted.join(' ')).toContain('Failed to connect to service');
      expect(formatted.join(' ')).toContain('Database connection failed');
    });
  });

  describe('Exit Handler', () => {
    it('should exit with correct code for non-recoverable errors', () => {
      const handler = createExitHandler(1);
      const error = createError('FATAL_ERROR', 'Critical failure', {
        recoverable: false,
      });

      expect(() => handler(error)).toThrow('process.exit called');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should always exit regardless of error type', () => {
      const handler = createExitHandler(2);
      const error = createError('RECOVERABLE_ERROR', 'Can be fixed', {
        recoverable: true,
      });

      expect(() => handler(error)).toThrow('process.exit called');
      expect(processExitSpy).toHaveBeenCalledWith(2);
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed operations with backoff', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          return {
            success: false,
            error: createError('TEMP_ERROR', 'Temporary failure', {
              recoverable: true,
            }),
          };
        }
        return { success: true, value: 'Success' };
      });

      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10,
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = vi.fn().mockResolvedValue({
        success: false,
        error: createError('PERSISTENT_ERROR', 'Persistent failure', {
          recoverable: true,
        }),
      });

      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockResolvedValue({
        success: false,
        error: createError('INVALID_INPUT', 'Bad input', {
          recoverable: false,
        }),
      });

      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery', () => {
    it('should attempt recovery for recoverable errors', async () => {
      const recoverFn = vi.fn().mockResolvedValue({
        success: true,
        value: 'Recovered',
      });

      const error = createError('RECOVERABLE', 'Can recover', {
        recoverable: true,
      });
      const failedResult = { success: false as const, error };
      const result = await tryRecover(failedResult, recoverFn);

      expect(result.success).toBe(true);
      expect(result.value).toBe('Recovered');
      expect(recoverFn).toHaveBeenCalledWith(error);
    });

    it('should not attempt recovery for non-recoverable errors', async () => {
      const recoverFn = vi.fn();

      const error = createError('FATAL', 'Cannot recover', {
        recoverable: false,
      });
      const failedResult = { success: false as const, error };
      const result = await tryRecover(failedResult, recoverFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(recoverFn).not.toHaveBeenCalled();
    });

    it('should handle recovery failures gracefully', async () => {
      const recoverFn = vi.fn().mockResolvedValue({
        success: false,
        error: createError('RECOVERY_FAILED', 'Recovery failed'),
      });

      const error = createError('RECOVERABLE', 'Can recover', {
        recoverable: true,
      });
      const failedResult = { success: false as const, error };
      const result = await tryRecover(failedResult, recoverFn);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Recovery failed');
    });
  });

  describe('Error Context', () => {
    it('should preserve error context through formatting', () => {
      const error: CLIError = {
        code: 'FILE_NOT_FOUND',
        message: 'Configuration file missing',
        details: 'Looking for tsconfig.json in /project/root',
        suggestion: 'Create a tsconfig.json file or specify a different path',
        recoverable: true,
      };

      const formatted = formatError(error, true); // verbose mode to include code
      const formattedString = formatted.join('\n');

      expect(formattedString).toContain('FILE_NOT_FOUND');
      expect(formattedString).toContain('Configuration file missing');
      expect(formattedString).toContain('Create a tsconfig.json');
    });
  });
});
