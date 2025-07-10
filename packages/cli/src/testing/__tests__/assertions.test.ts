import { describe, it, expect } from 'vitest';
import { expectResult, expectError } from '../assertions.js';
import { ok, err } from 'neverthrow';
import type { Result } from '../../core/errors/types.js';

describe('Testing Assertions', () => {
  describe('expectResult', () => {
    it('should pass for successful results', () => {
      const result = ok('success');

      // Should not throw
      expectResult(result);

      // TypeScript should now know result is successful
      if (result.isOk()) {
        expect(result.value).toBe('success');
      }
    });

    it('should throw for error results', () => {
      const result = err({
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        recoverable: false,
      });

      expect(() => expectResult(result)).toThrow();
    });

    it('should work with different value types', () => {
      const numberResult = ok(42);
      const objectResult = ok({ key: 'value' });
      const arrayResult = ok([1, 2, 3]);

      expectResult(numberResult);
      if (numberResult.isOk()) {
        expect(numberResult.value).toBe(42);
      }

      expectResult(objectResult);
      if (objectResult.isOk()) {
        expect(objectResult.value).toEqual({ key: 'value' });
      }

      expectResult(arrayResult);
      if (arrayResult.isOk()) {
        expect(arrayResult.value).toEqual([1, 2, 3]);
      }
    });

    it('should preserve type information for complex objects', () => {
      interface User {
        name: string;
        age: number;
      }

      const result = ok<User>({ name: 'Alice', age: 30 });

      expectResult(result);

      // TypeScript should know the exact type
      if (result.isOk()) {
        expect(result.value.name).toBe('Alice');
        expect(result.value.age).toBe(30);
      }
    });
  });

  describe('expectError', () => {
    it('should pass for error results', () => {
      const result = err({
        code: 'TEST_ERROR',
        message: 'Expected error',
        recoverable: false,
      });

      // Should not throw
      expectError(result);

      // TypeScript should now know result is an error
      if (result.isErr()) {
        expect(result.error.message).toBe('Expected error');
      }
    });

    it('should throw for successful results', () => {
      const result = ok('success');

      expect(() => expectError(result)).toThrow();
    });

    it('should work with different error types', () => {
      const stringError = err('string error');
      const objectError = err({ message: 'object error' });
      const classError = err(new Error('class error'));

      expectError(stringError);
      if (stringError.isErr()) {
        expect(stringError.error).toBe('string error');
      }

      expectError(objectError);
      if (objectError.isErr()) {
        expect(objectError.error.message).toBe('object error');
      }

      expectError(classError);
      if (classError.isErr()) {
        expect(classError.error.message).toBe('class error');
      }
    });

    it('should preserve error type information', () => {
      interface CustomError {
        code: string;
        message: string;
        details?: string;
      }

      const result = err<CustomError>({
        code: 'CUSTOM_ERROR',
        message: 'Custom error occurred',
        details: 'Additional context',
      });

      expectError(result);

      // TypeScript should know the exact error type
      if (result.isErr()) {
        expect(result.error.code).toBe('CUSTOM_ERROR');
        expect(result.error.message).toBe('Custom error occurred');
        expect(result.error.details).toBe('Additional context');
      }
    });
  });

  describe('type assertion behavior', () => {
    it('should provide proper type narrowing for success case', () => {
      function processResult(result: Result<string, string>): string {
        expectResult(result);
        // After expectResult, TypeScript should know result is ok
        if (result.isOk()) {
          return result.value.toUpperCase(); // No type error
        }
        throw new Error('Expected result to be ok');
      }

      const result = ok('hello');
      expect(processResult(result)).toBe('HELLO');
    });

    it('should provide proper type narrowing for error case', () => {
      function processError(result: Result<string, Error>): string {
        expectError(result);
        // After expectError, TypeScript should know result is err
        if (result.isErr()) {
          return result.error.message; // No type error
        }
        throw new Error('Expected result to be err');
      }

      const result = err(new Error('test error'));
      expect(processError(result)).toBe('test error');
    });

    it('should work in conditional scenarios', () => {
      function handleResult(result: Result<number, string>, expectSuccess: boolean): number {
        if (expectSuccess) {
          expectResult(result);
          if (result.isOk()) {
            return result.value * 2;
          }
          throw new Error('Expected success result');
        } else {
          expectError(result);
          if (result.isErr()) {
            return result.error.length;
          }
          throw new Error('Expected error result');
        }
      }

      // Test success path
      const successResult = ok(21);
      const processed = handleResult(successResult, true);
      expect(processed).toBe(42); // 21 * 2

      // Test error path
      const errorResult = err('test');
      const errorProcessed = handleResult(errorResult, false);
      expect(errorProcessed).toBe(4); // 'test'.length
    });
  });

  describe('integration with testing patterns', () => {
    it('should integrate well with vitest expect', () => {
      const results = [ok('first'), ok('second'), err('error')];

      // Test successful results
      expectResult(results[0]);
      if (results[0].isOk()) {
        expect(results[0].value).toBe('first');
      }

      expectResult(results[1]);
      if (results[1].isOk()) {
        expect(results[1].value).toBe('second');
      }

      // Test error result
      expectError(results[2]);
      if (results[2].isErr()) {
        expect(results[2].error).toBe('error');
      }
    });

    it('should provide clear error messages for debugging', () => {
      const result = err({
        code: 'VALIDATION_ERROR',
        message: 'Name field is required',
        field: 'name',
        recoverable: true,
      });

      try {
        expectResult(result);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle Results with undefined/null values', () => {
      const undefinedResult = ok(undefined);
      const nullResult = ok(null);

      expectResult(undefinedResult);
      if (undefinedResult.isOk()) {
        expect(undefinedResult.value).toBe(undefined);
      }

      expectResult(nullResult);
      if (nullResult.isOk()) {
        expect(nullResult.value).toBe(null);
      }
    });

    it('should handle complex nested Result scenarios', () => {
      type NestedResult = Result<Result<string, string>, Error>;

      const successSuccess: NestedResult = ok(ok('nested success'));
      const successError: NestedResult = ok(err('nested error'));
      const outerError: NestedResult = err(new Error('outer error'));

      // Test outer success
      expectResult(successSuccess);
      if (successSuccess.isOk()) {
        expectResult(successSuccess.value); // Inner success
        if (successSuccess.value.isOk()) {
          expect(successSuccess.value.value).toBe('nested success');
        }
      }

      expectResult(successError);
      if (successError.isOk()) {
        expectError(successError.value); // Inner error
        if (successError.value.isErr()) {
          expect(successError.value.error).toBe('nested error');
        }
      }

      // Test outer error
      expectError(outerError);
      if (outerError.isErr()) {
        expect(outerError.error.message).toBe('outer error');
      }
    });
  });
});
