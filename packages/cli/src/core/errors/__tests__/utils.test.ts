import { describe, it, expect, vi } from 'vitest';
import {
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  chain,
  expect as expectResult,
  toNullable,
  toOptional,
  getErrorMessage,
  match,
  all,
  tryCatch,
  tryCatchAsync,
} from '../utils.js';
import { Ok, Err } from '../factory.js';
import type { Result } from '../types.js';

describe('Error Utils', () => {
  describe('isOk', () => {
    it('should return true for successful results', () => {
      const result = Ok(42);
      expect(isOk(result)).toBe(true);

      // Type narrowing test
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('should return false for error results', () => {
      const result = Err('error');
      expect(isOk(result)).toBe(false);
    });
  });

  describe('isErr', () => {
    it('should return true for error results', () => {
      const result = Err('error');
      expect(isErr(result)).toBe(true);

      // Type narrowing test
      if (isErr(result)) {
        expect(result.error).toBe('error');
      }
    });

    it('should return false for successful results', () => {
      const result = Ok(42);
      expect(isErr(result)).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('should return value for successful results', () => {
      const result = Ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it('should throw for error results with error message', () => {
      const result = Err({ message: 'Something went wrong' });
      expect(() => unwrap(result)).toThrow('Something went wrong');
    });

    it('should throw generic message for errors without message', () => {
      const result = Err('string error');
      expect(() => unwrap(result)).toThrow('Result is an error');
    });
  });

  describe('unwrapOr', () => {
    it('should return value for successful results', () => {
      const result = Ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default value for error results', () => {
      const result = Err('error');
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('map', () => {
    it('should transform successful results', () => {
      const result = Ok(5);
      const mapped = map(result, x => x * 2);

      expect(mapped.success).toBe(true);
      expect(mapped.value).toBe(10);
    });

    it('should pass through error results unchanged', () => {
      const result = Err('error');
      const mapped = map(result, x => x * 2);

      expect(mapped.success).toBe(false);
      expect(mapped.error).toBe('error');
    });

    it('should handle type transformations', () => {
      const result = Ok(42);
      const mapped = map(result, x => x.toString());

      expect(mapped.success).toBe(true);
      expect(mapped.value).toBe('42');
      expect(typeof mapped.value).toBe('string');
    });
  });

  describe('mapErr', () => {
    it('should transform error results', () => {
      const result = Err('network error');
      const mapped = mapErr(result, e => `Failed: ${e}`);

      expect(mapped.success).toBe(false);
      expect(mapped.error).toBe('Failed: network error');
    });

    it('should pass through successful results unchanged', () => {
      const result = Ok(42);
      const mapped = mapErr(result, e => `Failed: ${e}`);

      expect(mapped.success).toBe(true);
      expect(mapped.value).toBe(42);
    });
  });

  describe('chain', () => {
    it('should chain successful operations', () => {
      const result = Ok(5);
      const chained = chain(result, x => (x > 0 ? Ok(x * 2) : Err('negative')));

      expect(chained.success).toBe(true);
      expect(chained.value).toBe(10);
    });

    it('should stop chain on first error', () => {
      const result = Ok(-5);
      const chained = chain(result, x => (x > 0 ? Ok(x * 2) : Err('negative')));

      expect(chained.success).toBe(false);
      expect(chained.error).toBe('negative');
    });

    it('should pass through initial errors', () => {
      const result = Err('initial error');
      const chained = chain(result, x => Ok(x * 2));

      expect(chained.success).toBe(false);
      expect(chained.error).toBe('initial error');
    });

    it('should handle type transformations in chain', () => {
      const result = Ok(42);
      const chained = chain(result, x => Ok(x.toString()));

      expect(chained.success).toBe(true);
      expect(chained.value).toBe('42');
      expect(typeof chained.value).toBe('string');
    });
  });

  describe('expect', () => {
    it('should return value for successful results', () => {
      const result = Ok(42);
      expect(expectResult(result, 'Should have value')).toBe(42);
    });

    it('should throw with custom message for error results', () => {
      const result = Err('original error');
      expect(() => expectResult(result, 'Custom error message')).toThrow('Custom error message');
    });
  });

  describe('toNullable', () => {
    it('should return value for successful results', () => {
      const result = Ok(42);
      expect(toNullable(result)).toBe(42);
    });

    it('should return null for error results', () => {
      const result = Err('error');
      expect(toNullable(result)).toBe(null);
    });
  });

  describe('toOptional', () => {
    it('should return value for successful results', () => {
      const result = Ok(42);
      expect(toOptional(result)).toBe(42);
    });

    it('should return undefined for error results', () => {
      const result = Err('error');
      expect(toOptional(result)).toBe(undefined);
    });
  });

  describe('getErrorMessage', () => {
    it('should return empty string for successful results', () => {
      const result = Ok(42);
      expect(getErrorMessage(result)).toBe('');
    });

    it('should extract message from Error objects', () => {
      const result = Err(new Error('Something went wrong'));
      expect(getErrorMessage(result)).toBe('Something went wrong');
    });

    it('should extract message from objects with message property', () => {
      const result = Err({ message: 'Custom error message' });
      expect(getErrorMessage(result)).toBe('Custom error message');
    });

    it('should use toString for other error types', () => {
      const result = Err('string error');
      expect(getErrorMessage(result)).toBe('string error');
    });

    it('should use default message for null/undefined errors', () => {
      const result = Err(null);
      expect(getErrorMessage(result)).toBe('Unknown error');
    });

    it('should use custom default message', () => {
      const result = Err(null);
      expect(getErrorMessage(result, 'Custom default')).toBe('Custom default');
    });
  });

  describe('match', () => {
    it('should call ok handler for successful results', () => {
      const result = Ok(42);
      const message = match(result, {
        ok: value => `Success: ${value}`,
        err: error => `Error: ${error}`,
      });

      expect(message).toBe('Success: 42');
    });

    it('should call err handler for error results', () => {
      const result = Err('failed');
      const message = match(result, {
        ok: value => `Success: ${value}`,
        err: error => `Error: ${error}`,
      });

      expect(message).toBe('Error: failed');
    });

    it('should handle different return types', () => {
      const successResult = Ok(42);
      const errorResult = Err('failed');

      const successCount = match(successResult, {
        ok: value => value * 2,
        err: () => 0,
      });

      const errorCount = match(errorResult, {
        ok: value => value * 2,
        err: () => 0,
      });

      expect(successCount).toBe(84);
      expect(errorCount).toBe(0);
    });
  });

  describe('all', () => {
    it('should combine successful results', () => {
      const results = [Ok(1), Ok(2), Ok(3)] as const;
      const combined = all(results);

      expect(combined.success).toBe(true);
      expect(combined.value).toEqual([1, 2, 3]);
    });

    it('should return first error when any result fails', () => {
      const results = [Ok(1), Err('failed'), Ok(3)] as const;
      const combined = all(results);

      expect(combined.success).toBe(false);
      expect(combined.error).toBe('failed');
    });

    it('should handle empty array', () => {
      const results: Result<never, never>[] = [];
      const combined = all(results);

      expect(combined.success).toBe(true);
      expect(combined.value).toEqual([]);
    });

    it('should preserve types', () => {
      const results = [Ok('hello'), Ok(42), Ok(true)] as const;
      const combined = all(results);

      if (combined.success) {
        // TypeScript should infer the correct tuple type
        expect(combined.value[0]).toBe('hello');
        expect(combined.value[1]).toBe(42);
        expect(combined.value[2]).toBe(true);
      }
    });
  });

  describe('tryCatch', () => {
    it('should wrap successful function calls', () => {
      const result = tryCatch(() => JSON.parse('{"valid": true}'));

      expect(result.success).toBe(true);
      expect(result.value).toEqual({ valid: true });
    });

    it('should catch and wrap exceptions', () => {
      const result = tryCatch(() => JSON.parse('invalid json'));

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(SyntaxError);
    });

    it('should use custom error mapper', () => {
      const result = tryCatch(
        () => JSON.parse('invalid json'),
        error => `Parse failed: ${(error as Error).message}`
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Parse failed:');
    });

    it('should handle non-Error exceptions', () => {
      const result = tryCatch(() => {
        throw 'string error';
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('string error');
    });
  });

  describe('tryCatchAsync', () => {
    it('should wrap successful async function calls', async () => {
      const result = await tryCatchAsync(async () => {
        return Promise.resolve('success');
      });

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
    });

    it('should catch and wrap async exceptions', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('async error');
      });

      expect(result.success).toBe(false);
      expect((result.error as Error).message).toBe('async error');
    });

    it('should handle rejected promises', async () => {
      const result = await tryCatchAsync(async () => {
        return Promise.reject(new Error('rejected'));
      });

      expect(result.success).toBe(false);
      expect((result.error as Error).message).toBe('rejected');
    });

    it('should use custom error mapper for async', async () => {
      const result = await tryCatchAsync(
        async () => {
          throw new Error('network failure');
        },
        error => `Network error: ${(error as Error).message}`
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error: network failure');
    });

    it('should handle non-Error async exceptions', async () => {
      const result = await tryCatchAsync(async () => {
        throw 'async string error';
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('async string error');
    });

    it('should work with real async operations', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await tryCatchAsync(async () => {
        const response = await mockFetch('/api/data');
        return response.json();
      });

      expect(result.success).toBe(true);
      expect(result.value).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith('/api/data');
    });
  });

  describe('Result composition patterns', () => {
    it('should handle complex chaining scenarios', () => {
      const parseNumber = (str: string): Result<number, string> => {
        const num = parseInt(str, 10);
        return isNaN(num) ? Err('Not a number') : Ok(num);
      };

      const validatePositive = (num: number): Result<number, string> => {
        return num > 0 ? Ok(num) : Err('Not positive');
      };

      const double = (num: number): Result<number, string> => Ok(num * 2);

      // Chain multiple operations
      const result = chain(chain(parseNumber('42'), validatePositive), double);

      expect(result.success).toBe(true);
      expect(result.value).toBe(84);

      // Test failure in chain
      const failResult = chain(chain(parseNumber('-5'), validatePositive), double);

      expect(failResult.success).toBe(false);
      expect(failResult.error).toBe('Not positive');
    });

    it('should handle map and chain combinations', () => {
      const result = Ok(10);

      const processed = chain(
        map(result, x => x.toString()),
        str => (str.length > 1 ? Ok(str) : Err('Too short'))
      );

      expect(processed.success).toBe(true);
      expect(processed.value).toBe('10');
    });

    it('should handle all with mixed success/failure', () => {
      const getUserData = (id: number): Result<string, string> => {
        return id > 0 ? Ok(`User ${id}`) : Err(`Invalid ID: ${id}`);
      };

      const allSuccess = all([getUserData(1), getUserData(2), getUserData(3)]);

      expect(allSuccess.success).toBe(true);
      expect(allSuccess.value).toEqual(['User 1', 'User 2', 'User 3']);

      const withFailure = all([getUserData(1), getUserData(-1), getUserData(3)]);

      expect(withFailure.success).toBe(false);
      expect(withFailure.error).toBe('Invalid ID: -1');
    });
  });
});
