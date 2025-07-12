import { describe, it, expect } from 'vitest';
import { ok, err } from 'neverthrow';
import {
  createCoreError,
  withContext,
  chainError,
  getErrorMessage,
  isRecoverableError,
  getErrorType,
  getErrorCategory,
} from '../src/errors/index.js';

describe('Foundation Error System', () => {
  describe('Base Error Creation', () => {
    it('should create a basic CoreError', () => {
      const error = createCoreError('TEST_ERROR', 'Test message', {
        details: 'Test details',
        suggestion: 'Test suggestion',
        recoverable: true,
      });

      expect(error).toEqual({
        type: 'TEST_ERROR',
        message: 'Test message',
        details: 'Test details',
        suggestion: 'Test suggestion',
        recoverable: true,
        cause: undefined,
        context: undefined,
      });
    });

    it('should create error with minimal options', () => {
      const error = createCoreError('MINIMAL_ERROR', 'Minimal message');

      expect(error).toEqual({
        type: 'MINIMAL_ERROR',
        message: 'Minimal message',
        details: undefined,
        suggestion: undefined,
        recoverable: false,
        cause: undefined,
        context: undefined,
      });
    });

    it('should create error with custom context', () => {
      const error = createCoreError('CONTEXT_ERROR', 'Context message', {
        context: { userId: '123', operation: 'test' },
        recoverable: true,
      });

      expect(error.context).toEqual({ userId: '123', operation: 'test' });
      expect(error.recoverable).toBe(true);
    });
  });

  describe('Error Enhancement', () => {
    it('should add context to error', () => {
      const baseError = createCoreError('BASE_ERROR', 'Base message');

      const enhancedError = withContext(baseError, {
        operation: 'test-operation',
        component: 'test-component',
        timestamp: new Date('2023-01-01'),
      });

      expect(enhancedError.details).toContain('Operation: test-operation');
      expect(enhancedError.details).toContain('Component: test-component');
      expect(enhancedError.context).toEqual({
        operation: 'test-operation',
        component: 'test-component',
        timestamp: new Date('2023-01-01'),
      });
    });

    it('should chain errors together', () => {
      const baseError = createCoreError('BASE_ERROR', 'Base message');
      const causeError = new Error('Cause error');

      const chainedError = chainError(baseError, causeError);

      expect(chainedError.cause).toBe(causeError);
      expect(chainedError.type).toBe('BASE_ERROR');
      expect(chainedError.message).toBe('Base message');
    });

    it('should merge context when adding to existing context', () => {
      const baseError = createCoreError('BASE_ERROR', 'Base message', {
        context: { existingKey: 'existing' },
      });

      const enhancedError = withContext(baseError, {
        operation: 'test-operation',
        component: 'test-component',
        timestamp: new Date('2023-01-01'),
        metadata: { newKey: 'new' },
      });

      expect(enhancedError.context).toEqual({
        existingKey: 'existing',
        operation: 'test-operation',
        component: 'test-component',
        timestamp: new Date('2023-01-01'),
        metadata: { newKey: 'new' },
      });
    });
  });

  describe('Error Utilities', () => {
    it('should extract error message from various error types', () => {
      expect(getErrorMessage(new Error('Standard error'))).toBe('Standard error');
      expect(getErrorMessage('String error')).toBe('String error');
      expect(getErrorMessage({ message: 'Object with message' })).toBe('Object with message');
      expect(getErrorMessage(42)).toBe('Unknown error');
      expect(getErrorMessage(null)).toBe('Unknown error');
      expect(getErrorMessage(undefined, 'Custom default')).toBe('Custom default');
    });

    it('should extract error message with toString fallback', () => {
      const customError = {
        toString: () => 'Custom toString',
      };
      expect(getErrorMessage(customError)).toBe('Custom toString');
    });

    it('should not use object toString', () => {
      const plainObject = { someKey: 'someValue' };
      expect(getErrorMessage(plainObject)).toBe('Unknown error');
    });

    it('should check if error is recoverable', () => {
      expect(isRecoverableError({ recoverable: true })).toBe(true);
      expect(isRecoverableError({ recoverable: false })).toBe(false);
      expect(isRecoverableError({})).toBe(false);
    });

    it('should extract error type', () => {
      expect(getErrorType({ type: 'CUSTOM_ERROR' })).toBe('CUSTOM_ERROR');
      expect(getErrorType({})).toBe('unknown');
    });

    it('should extract error category', () => {
      expect(getErrorCategory({ category: 'validation' })).toBe('validation');
      expect(getErrorCategory({})).toBe('unknown');
    });
  });

  describe('Result Type Integration', () => {
    it('should work with neverthrow Result types', () => {
      const error = createCoreError('RESULT_ERROR', 'Result error message');
      const errorResult = err(error);

      expect(errorResult.isErr()).toBe(true);
      if (errorResult.isErr()) {
        expect(errorResult.error.type).toBe('RESULT_ERROR');
        expect(errorResult.error.message).toBe('Result error message');
      }
    });

    it('should work in Result chains', () => {
      const processValue = (x: number) => {
        if (x < 0) {
          return err(createCoreError('VALIDATION_ERROR', 'Value must be positive'));
        }
        return ok(x * 2);
      };

      const positiveResult = processValue(5);
      const negativeResult = processValue(-1);

      expect(positiveResult.isOk()).toBe(true);
      expect(negativeResult.isErr()).toBe(true);

      if (negativeResult.isErr()) {
        expect(negativeResult.error.type).toBe('VALIDATION_ERROR');
      }
    });
  });
});
