import { describe, it, expect, vi } from 'vitest';
import { ok, err, fromThrowable, fromPromise } from 'neverthrow';
import { combine } from '../utils.js';
import type { Result } from '../types.js';

describe('Error Utils', () => {
  describe('isOk', () => {
    it('should return true for successful results', () => {
      const result = ok(42);
      expect(result.isOk()).toBe(true);

      // Type narrowing test
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    it('should return false for error results', () => {
      const result = err('error');
      expect(result.isOk()).toBe(false);
    });
  });

  describe('isErr', () => {
    it('should return true for error results', () => {
      const result = err('error');
      expect(result.isErr()).toBe(true);

      // Type narrowing test
      if (result.isErr()) {
        expect(result.error).toBe('error');
      }
    });

    it('should return false for successful results', () => {
      const result = ok(42);
      expect(result.isErr()).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('should return value for successful results', () => {
      const result = ok(42);
      expect(result._unsafeUnwrap()).toBe(42);
    });

    it('should throw for error results', () => {
      const result = err({ message: 'Something went wrong' });
      expect(() => result._unsafeUnwrap()).toThrow();
    });
  });

  describe('unwrapOr', () => {
    it('should return value for successful results', () => {
      const result = ok(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    it('should return default value for error results', () => {
      const result = err('error');
      expect(result.unwrapOr(0)).toBe(0);
    });
  });

  describe('map', () => {
    it('should transform successful results', () => {
      const result = ok(5);
      const mapped = result.map(x => x * 2);

      expect(mapped.isOk()).toBe(true);
      if (mapped.isOk()) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should pass through error results unchanged', () => {
      const result = err('error');
      const mapped = result.map(x => x * 2);

      expect(mapped.isErr()).toBe(true);
      if (mapped.isErr()) {
        expect(mapped.error).toBe('error');
      }
    });

    it('should handle type transformations', () => {
      const result = ok(42);
      const mapped = result.map(x => x.toString());

      expect(mapped.isOk()).toBe(true);
      if (mapped.isOk()) {
        expect(mapped.value).toBe('42');
        expect(typeof mapped.value).toBe('string');
      }
    });
  });

  describe('mapErr', () => {
    it('should transform error results', () => {
      const result = err('network error');
      const mapped = result.mapErr(e => `Failed: ${e}`);

      expect(mapped.isErr()).toBe(true);
      if (mapped.isErr()) {
        expect(mapped.error).toBe('Failed: network error');
      }
    });

    it('should pass through successful results unchanged', () => {
      const result = ok(42);
      const mapped = result.mapErr(e => `Failed: ${e}`);

      expect(mapped.isOk()).toBe(true);
      if (mapped.isOk()) {
        expect(mapped.value).toBe(42);
      }
    });
  });

  describe('andThen', () => {
    it('should chain successful operations', () => {
      const result = ok(5);
      const chained = result.andThen(x => (x > 0 ? ok(x * 2) : err('negative')));

      expect(chained.isOk()).toBe(true);
      if (chained.isOk()) {
        expect(chained.value).toBe(10);
      }
    });

    it('should stop chain on first error', () => {
      const result = ok(-5);
      const chained = result.andThen(x => (x > 0 ? ok(x * 2) : err('negative')));

      expect(chained.isErr()).toBe(true);
      if (chained.isErr()) {
        expect(chained.error).toBe('negative');
      }
    });

    it('should pass through initial errors', () => {
      const result = err('initial error');
      const chained = result.andThen(x => ok(x * 2));

      expect(chained.isErr()).toBe(true);
      if (chained.isErr()) {
        expect(chained.error).toBe('initial error');
      }
    });

    it('should handle type transformations in chain', () => {
      const result = ok(42);
      const chained = result.andThen(x => ok(x.toString()));

      expect(chained.isOk()).toBe(true);
      if (chained.isOk()) {
        expect(chained.value).toBe('42');
        expect(typeof chained.value).toBe('string');
      }
    });
  });

  describe('_unsafeUnwrapErr', () => {
    it('should return error for error results', () => {
      const result = err('test error');
      expect(result._unsafeUnwrapErr()).toBe('test error');
    });

    it('should throw for successful results', () => {
      const result = ok(42);
      expect(() => result._unsafeUnwrapErr()).toThrow();
    });
  });

  // Removed toNullable, toOptional, getErrorMessage tests - these utilities are not needed with neverthrow

  describe('match', () => {
    it('should call ok handler for successful results', () => {
      const result = ok(42);
      const message = result.match(
        value => `Success: ${value}`,
        error => `Error: ${error}`
      );

      expect(message).toBe('Success: 42');
    });

    it('should call err handler for error results', () => {
      const result = err('failed');
      const message = result.match(
        value => `Success: ${value}`,
        error => `Error: ${error}`
      );

      expect(message).toBe('Error: failed');
    });

    it('should handle different return types', () => {
      const successResult = ok(42);
      const errorResult = err('failed');

      const successCount = successResult.match(
        value => value * 2,
        () => 0
      );

      const errorCount = errorResult.match(
        value => value * 2,
        () => 0
      );

      expect(successCount).toBe(84);
      expect(errorCount).toBe(0);
    });
  });

  describe('combine', () => {
    it('should combine successful results', () => {
      const results = [ok(1), ok(2), ok(3)] as const;
      const combined = combine(results);

      expect(combined.isOk()).toBe(true);
      if (combined.isOk()) {
        expect(combined.value).toEqual([1, 2, 3]);
      }
    });

    it('should return first error when any result fails', () => {
      const results = [ok(1), err('failed'), ok(3)] as const;
      const combined = combine(results);

      expect(combined.isErr()).toBe(true);
      if (combined.isErr()) {
        expect(combined.error).toBe('failed');
      }
    });

    it('should handle empty array', () => {
      const results: Result<never, never>[] = [];
      const combined = combine(results);

      expect(combined.isOk()).toBe(true);
      if (combined.isOk()) {
        expect(combined.value).toEqual([]);
      }
    });

    it('should preserve types', () => {
      const results = [ok('hello'), ok(42), ok(true)] as const;
      const combined = combine(results);

      if (combined.isOk()) {
        // TypeScript should infer the correct tuple type
        expect(combined.value[0]).toBe('hello');
        expect(combined.value[1]).toBe(42);
        expect(combined.value[2]).toBe(true);
      }
    });
  });

  describe('fromThrowable', () => {
    it('should wrap successful function calls', () => {
      const safeParse = fromThrowable(JSON.parse);
      const result = safeParse('{"valid": true}');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ valid: true });
      }
    });

    it('should catch and wrap exceptions', () => {
      const safeParse = fromThrowable(JSON.parse);
      const result = safeParse('invalid json');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(SyntaxError);
      }
    });

    it('should use custom error mapper', () => {
      const safeParse = fromThrowable(
        JSON.parse,
        error => `Parse failed: ${(error as Error).message}`
      );
      const result = safeParse('invalid json');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Parse failed:');
      }
    });
  });

  describe('fromPromise', () => {
    it('should wrap successful async function calls', async () => {
      const result = await fromPromise(Promise.resolve('success'), e => e);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('success');
      }
    });

    it('should catch and wrap async exceptions', async () => {
      const result = await fromPromise(Promise.reject(new Error('async error')), e => e);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect((result.error as Error).message).toBe('async error');
      }
    });

    it('should use custom error mapper for async', async () => {
      const result = await fromPromise(
        Promise.reject(new Error('network failure')),
        error => `Network error: ${(error as Error).message}`
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Network error: network failure');
      }
    });

    it('should work with real async operations', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await fromPromise(
        (async () => {
          const response = await mockFetch('/api/data');
          return response.json();
        })(),
        e => e
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ data: 'test' });
      }
      expect(mockFetch).toHaveBeenCalledWith('/api/data');
    });
  });

  describe('Result composition patterns', () => {
    it('should handle complex chaining scenarios', () => {
      const parseNumber = (str: string): Result<number, string> => {
        const num = parseInt(str, 10);
        return isNaN(num) ? err('Not a number') : ok(num);
      };

      const validatePositive = (num: number): Result<number, string> => {
        return num > 0 ? ok(num) : err('Not positive');
      };

      const double = (num: number): Result<number, string> => ok(num * 2);

      // Chain multiple operations
      const result = parseNumber('42').andThen(validatePositive).andThen(double);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(84);
      }

      // Test failure in chain
      const failResult = parseNumber('-5').andThen(validatePositive).andThen(double);

      expect(failResult.isErr()).toBe(true);
      if (failResult.isErr()) {
        expect(failResult.error).toBe('Not positive');
      }
    });

    it('should handle map and andThen combinations', () => {
      const result = ok(10);

      const processed = result
        .map(x => x.toString())
        .andThen(str => (str.length > 1 ? ok(str) : err('Too short')));

      expect(processed.isOk()).toBe(true);
      if (processed.isOk()) {
        expect(processed.value).toBe('10');
      }
    });

    it('should handle combine with mixed success/failure', () => {
      const getUserData = (id: number): Result<string, string> => {
        return id > 0 ? ok(`User ${id}`) : err(`Invalid ID: ${id}`);
      };

      const allSuccess = combine([getUserData(1), getUserData(2), getUserData(3)]);

      expect(allSuccess.isOk()).toBe(true);
      if (allSuccess.isOk()) {
        expect(allSuccess.value).toEqual(['User 1', 'User 2', 'User 3']);
      }

      const withFailure = combine([getUserData(1), getUserData(-1), getUserData(3)]);

      expect(withFailure.isErr()).toBe(true);
      if (withFailure.isErr()) {
        expect(withFailure.error).toBe('Invalid ID: -1');
      }
    });
  });
});
