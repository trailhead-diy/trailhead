import { describe, it, expect, vi } from 'vitest';

// Mock p-retry - must be hoisted
vi.mock('p-retry', () => ({
  default: vi.fn().mockImplementation(async (operation, options) => {
    // For testing, we need to properly simulate retry behavior
    let attempts = 0;
    const maxRetries = options?.retries ?? 3;

    while (attempts <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        if (options?.onFailedAttempt) {
          options.onFailedAttempt(error);
        }

        if (attempts > maxRetries) {
          throw error;
        }
      }
    }
  }),
}));

import { classifyError, isRetryableError, retryableOperation } from '../index.js';

describe('Error Recovery', () => {
  describe('classifyError', () => {
    it('should classify network errors', () => {
      const timeoutError = new Error('Connection timeout');
      const notFoundError = new Error('Host enotfound example.com');
      const refusedError = new Error('Connection econnrefused');

      expect(classifyError(timeoutError)).toBe('network');
      expect(classifyError(notFoundError)).toBe('network');
      expect(classifyError(refusedError)).toBe('network');
    });

    it('should classify permission errors', () => {
      const permissionError = new Error('Permission denied');
      const eaccesError = new Error('EACCES: access denied');
      const epermError = new Error('EPERM: operation not permitted');

      expect(classifyError(permissionError)).toBe('permission');
      expect(classifyError(eaccesError)).toBe('permission');
      expect(classifyError(epermError)).toBe('permission');
    });

    it('should classify filesystem errors', () => {
      const noentError = new Error('ENOENT: no such file');
      const fileError = new Error('No such file or directory');

      expect(classifyError(noentError)).toBe('filesystem');
      expect(classifyError(fileError)).toBe('filesystem');
    });

    it('should classify validation errors', () => {
      const validationError = new Error('Validation failed');
      const inputError = new Error('Invalid input provided');
      const schemaError = new Error('Schema validation error');

      expect(classifyError(validationError)).toBe('validation');
      expect(classifyError(inputError)).toBe('validation');
      expect(classifyError(schemaError)).toBe('validation');
    });

    it('should classify configuration errors', () => {
      const configError = new Error('Invalid config file');
      const malformedError = new Error('Malformed JSON');
      const parseError = new Error('Parse error in configuration');

      expect(classifyError(configError)).toBe('configuration');
      expect(classifyError(malformedError)).toBe('configuration');
      expect(classifyError(parseError)).toBe('configuration');
    });

    it('should classify dependency errors', () => {
      const conflictError = new Error('Dependency conflict detected');
      const peerError = new Error('Peer dependency missing');
      const versionError = new Error('Version mismatch found');

      expect(classifyError(conflictError)).toBe('dependency');
      expect(classifyError(peerError)).toBe('dependency');
      expect(classifyError(versionError)).toBe('dependency');
    });

    it('should classify unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      const genericError = new Error('Unexpected error');

      expect(classifyError(unknownError)).toBe('unknown');
      expect(classifyError(genericError)).toBe('unknown');
    });

    it('should handle case insensitive matching', () => {
      const upperCaseError = new Error('CONNECTION TIMEOUT');
      const mixedCaseError = new Error('Permission DENIED');

      expect(classifyError(upperCaseError)).toBe('network');
      expect(classifyError(mixedCaseError)).toBe('permission');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const networkError = new Error('Connection timeout');
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should return true for filesystem errors', () => {
      const fsError = new Error('ENOENT: no such file');
      expect(isRetryableError(fsError)).toBe(true);
    });

    it('should return false for permission errors', () => {
      const permError = new Error('Permission denied');
      expect(isRetryableError(permError)).toBe(false);
    });

    it('should return false for validation errors', () => {
      const validationError = new Error('Validation failed');
      expect(isRetryableError(validationError)).toBe(false);
    });

    it('should return false for configuration errors', () => {
      const configError = new Error('Invalid config');
      expect(isRetryableError(configError)).toBe(false);
    });

    it('should return false for dependency errors', () => {
      const depError = new Error('Dependency conflict');
      expect(isRetryableError(depError)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const unknownError = new Error('Unknown error');
      expect(isRetryableError(unknownError)).toBe(false);
    });
  });

  describe('retryableOperation', () => {
    it('should call p-retry with default options', async () => {
      const pRetry = (await import('p-retry')).default;
      const operation = vi.fn().mockResolvedValue('success');

      await retryableOperation(operation);

      expect(pRetry).toHaveBeenCalledWith(operation, {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
        onFailedAttempt: expect.any(Function),
      });
    });

    it('should call p-retry with custom options', async () => {
      const pRetry = (await import('p-retry')).default;
      const operation = vi.fn().mockResolvedValue('success');
      const options = {
        retries: 5,
        factor: 3,
        minTimeout: 500,
        maxTimeout: 10000,
      };

      await retryableOperation(operation, options);

      expect(pRetry).toHaveBeenCalledWith(operation, {
        retries: 5,
        factor: 3,
        minTimeout: 500,
        maxTimeout: 10000,
        onFailedAttempt: expect.any(Function),
      });
    });

    it('should return operation result on success', async () => {
      const operation = vi.fn().mockResolvedValue('operation success');

      const result = await retryableOperation(operation);

      expect(result).toBe('operation success');
    });

    it('should throw error if operation fails with non-retryable error', async () => {
      const permissionError = new Error('Permission denied');
      const operation = vi.fn().mockRejectedValue(permissionError);

      await expect(retryableOperation(operation)).rejects.toThrow('Permission denied');
    });

    it('should handle retryable errors correctly', async () => {
      const pRetry = (await import('p-retry')).default;
      const networkError = new Error('Connection timeout');
      const operation = vi.fn().mockRejectedValue(networkError);

      try {
        await retryableOperation(operation);
      } catch {
        // Expected to fail
      }

      expect(pRetry).toHaveBeenCalledWith(
        operation,
        expect.objectContaining({
          onFailedAttempt: expect.any(Function),
        })
      );
    });
  });

  describe('Integration', () => {
    it('should work end-to-end with retryable error', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Connection timeout'); // Retryable
        }
        return 'success after retry';
      });

      const result = await retryableOperation(operation, { retries: 2 });

      expect(result).toBe('success after retry');
      expect(attempts).toBe(2);
    });

    it('should fail fast with non-retryable error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Validation failed'));

      await expect(retryableOperation(operation)).rejects.toThrow('Validation failed');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
