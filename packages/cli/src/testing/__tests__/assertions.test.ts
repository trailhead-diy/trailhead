import { describe, it, expect } from 'vitest';
import { expectResult, expectError } from '../assertions.js';
import { Ok, Err } from '../../core/errors/index.js';

describe('Testing Assertions', () => {
  describe('expectResult', () => {
    it('should pass for successful results', () => {
      const result = Ok('success');
      
      // Should not throw
      expectResult(result);
      
      // TypeScript should now know result is successful
      expect(result.value).toBe('success');
    });

    it('should throw for error results', () => {
      const result = Err({
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        recoverable: false,
      });
      
      expect(() => expectResult(result)).toThrow(
        'Expected successful result, but got error: Something went wrong'
      );
    });

    it('should work with different value types', () => {
      const numberResult = Ok(42);
      const objectResult = Ok({ key: 'value' });
      const arrayResult = Ok([1, 2, 3]);
      
      expectResult(numberResult);
      expect(numberResult.value).toBe(42);
      
      expectResult(objectResult);
      expect(objectResult.value).toEqual({ key: 'value' });
      
      expectResult(arrayResult);
      expect(arrayResult.value).toEqual([1, 2, 3]);
    });

    it('should preserve type information for complex objects', () => {
      interface User {
        name: string;
        age: number;
      }
      
      const result = Ok<User>({ name: 'Alice', age: 30 });
      
      expectResult(result);
      
      // TypeScript should know the exact type
      expect(result.value.name).toBe('Alice');
      expect(result.value.age).toBe(30);
    });
  });

  describe('expectError', () => {
    it('should pass for error results', () => {
      const result = Err({
        code: 'TEST_ERROR',
        message: 'Expected error',
        recoverable: false,
      });
      
      // Should not throw
      expectError(result);
      
      // TypeScript should now know result is an error
      expect(result.error.message).toBe('Expected error');
    });

    it('should throw for successful results', () => {
      const result = Ok('success');
      
      expect(() => expectError(result)).toThrow(
        'Expected error result, but operation succeeded'
      );
    });

    it('should work with different error types', () => {
      const stringError = Err('string error');
      const objectError = Err({ message: 'object error' });
      const classError = Err(new Error('class error'));
      
      expectError(stringError);
      expect(stringError.error).toBe('string error');
      
      expectError(objectError);
      expect(objectError.error.message).toBe('object error');
      
      expectError(classError);
      expect(classError.error.message).toBe('class error');
    });

    it('should preserve error type information', () => {
      interface CustomError {
        code: string;
        message: string;
        details?: string;
      }
      
      const result = Err<CustomError>({
        code: 'CUSTOM_ERROR',
        message: 'Custom error occurred',
        details: 'Additional context',
      });
      
      expectError(result);
      
      // TypeScript should know the exact error type
      expect(result.error.code).toBe('CUSTOM_ERROR');
      expect(result.error.message).toBe('Custom error occurred');
      expect(result.error.details).toBe('Additional context');
    });
  });

  describe('type assertion behavior', () => {
    it('should provide proper type narrowing for success case', () => {
      function processResult(result: Result<string, string>): string {
        expectResult(result);
        // After expectResult, TypeScript knows result.success is true
        return result.value.toUpperCase(); // No type error
      }

      const result = Ok('hello');
      expect(processResult(result)).toBe('HELLO');
    });

    it('should provide proper type narrowing for error case', () => {
      function processError(result: Result<string, Error>): string {
        expectError(result);
        // After expectError, TypeScript knows result.success is false
        return result.error.message; // No type error
      }

      const result = Err(new Error('test error'));
      expect(processError(result)).toBe('test error');
    });

    it('should work in conditional scenarios', () => {
      function handleResult(result: Result<number, string>, expectSuccess: boolean): number {
        if (expectSuccess) {
          expectResult(result);
          return result.value * 2;
        } else {
          expectError(result);
          return result.error.length;
        }
      }

      // Test success path
      const successResult = Ok(21);
      const processed = handleResult(successResult, true);
      expect(processed).toBe(42); // 21 * 2

      // Test error path
      const errorResult = Err('test');
      const errorProcessed = handleResult(errorResult, false);
      expect(errorProcessed).toBe(4); // 'test'.length
    });
  });

  describe('integration with testing patterns', () => {
    it('should integrate well with vitest expect', () => {
      const results = [
        Ok('first'),
        Ok('second'),
        Err('error'),
      ];

      // Test successful results
      expectResult(results[0]);
      expect(results[0].value).toBe('first');

      expectResult(results[1]);
      expect(results[1].value).toBe('second');

      // Test error result
      expectError(results[2]);
      expect(results[2].error).toBe('error');
    });

    it('should provide clear error messages for debugging', () => {
      const result = Err({
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
        expect((error as Error).message).toBe(
          'Expected successful result, but got error: Name field is required'
        );
      }
    });

    it('should handle Results with undefined/null values', () => {
      const undefinedResult = Ok(undefined);
      const nullResult = Ok(null);
      
      expectResult(undefinedResult);
      expect(undefinedResult.value).toBe(undefined);
      
      expectResult(nullResult);
      expect(nullResult.value).toBe(null);
    });

    it('should handle complex nested Result scenarios', () => {
      type NestedResult = Result<Result<string, string>, Error>;
      
      const successSuccess: NestedResult = Ok(Ok('nested success'));
      const successError: NestedResult = Ok(Err('nested error'));
      const outerError: NestedResult = Err(new Error('outer error'));
      
      // Test outer success
      expectResult(successSuccess);
      expectResult(successSuccess.value); // Inner success
      expect(successSuccess.value.value).toBe('nested success');
      
      expectResult(successError);
      expectError(successError.value); // Inner error
      expect(successError.value.error).toBe('nested error');
      
      // Test outer error
      expectError(outerError);
      expect(outerError.error.message).toBe('outer error');
    });
  });
});