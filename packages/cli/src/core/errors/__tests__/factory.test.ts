import { describe, it, expect } from 'vitest';
import { ok, err } from 'neverthrow';
import {
  createError,
  createSeverityError,
  validationError,
  requiredFieldError,
  invalidTypeError,
  fileSystemError,
  fileNotFoundError,
  networkError,
  executionError,
  userInputError,
  dependencyError,
} from '../factory.js';

describe('Error Factory - Core Functions', () => {
  describe('Result constructors', () => {
    describe('ok', () => {
      it('should create successful result', () => {
        const result = ok(42);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(42);
        }
      });

      it('should handle different value types', () => {
        const stringResult = ok('test');
        const objectResult = ok({ foo: 'bar' });
        const nullResult = ok(null);

        expect(stringResult.isOk()).toBe(true);
        expect(objectResult.isOk()).toBe(true);
        expect(nullResult.isOk()).toBe(true);
      });
    });

    describe('err', () => {
      it('should create error result', () => {
        const error = createError('TEST_ERROR', 'Test error message');
        const result = err(error);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBe(error);
        }
      });
    });
  });

  describe('createError', () => {
    it('should create basic error', () => {
      const error = createError('TEST_CODE', 'Test message');

      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.recoverable).toBe(false);
    });

    it('should create error with options', () => {
      const cause = new Error('Root cause');
      const error = createError('COMPLEX_ERROR', 'Complex error', {
        details: 'Additional details',
        cause,
        suggestion: 'Try this fix',
        recoverable: true,
      });

      expect(error.code).toBe('COMPLEX_ERROR');
      expect(error.message).toBe('Complex error');
      expect(error.details).toBe('Additional details');
      expect(error.cause).toBe(cause);
      expect(error.suggestion).toBe('Try this fix');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('createSeverityError', () => {
    it('should add severity to existing error', () => {
      const baseError = createError('TEST_ERROR', 'Test message');
      const severityError = createSeverityError(baseError, 'critical');

      expect(severityError.code).toBe('TEST_ERROR');
      expect(severityError.message).toBe('Test message');
      expect(severityError.severity).toBe('critical');
    });

    it('should handle all severity levels', () => {
      const baseError = createError('TEST', 'Test');

      const info = createSeverityError(baseError, 'info');
      const warning = createSeverityError(baseError, 'warning');
      const error = createSeverityError(baseError, 'error');
      const critical = createSeverityError(baseError, 'critical');

      expect(info.severity).toBe('info');
      expect(warning.severity).toBe('warning');
      expect(error.severity).toBe('error');
      expect(critical.severity).toBe('critical');
    });
  });

  describe('validationError', () => {
    it('should create basic validation error', () => {
      const error = validationError('Invalid input');

      expect(error.category).toBe('validation');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.recoverable).toBe(true);
    });

    it('should create validation error with options', () => {
      const error = validationError('Field is invalid', {
        field: 'email',
        value: 'invalid-email',
        constraints: { format: 'email' },
        suggestion: 'Use valid email format',
      });

      expect(error.category).toBe('validation');
      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid-email');
      expect(error.constraints).toEqual({ format: 'email' });
      expect(error.suggestion).toBe('Use valid email format');
    });
  });

  describe('requiredFieldError', () => {
    it('should create required field error', () => {
      const error = requiredFieldError('username');

      expect(error.category).toBe('validation');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe("Required field 'username' is missing");
      expect(error.field).toBe('username');
      expect(error.suggestion).toBe("Provide a value for 'username'");
    });
  });

  describe('invalidTypeError', () => {
    it('should create invalid type error', () => {
      const error = invalidTypeError('age', 'number', 'twenty');

      expect(error.category).toBe('validation');
      expect(error.message).toBe("Field 'age' must be of type 'number', got 'string'");
      expect(error.field).toBe('age');
      expect(error.value).toBe('twenty');
      expect(error.constraints).toEqual({
        expectedType: 'number',
        actualType: 'string',
      });
    });

    it('should handle array type detection', () => {
      const error = invalidTypeError('items', 'object', [1, 2, 3]);

      expect(error.constraints).toEqual({
        expectedType: 'object',
        actualType: 'array',
      });
    });
  });

  describe('fileSystemError', () => {
    it('should create basic filesystem error', () => {
      const error = fileSystemError('read', '/test/file.txt', 'Cannot read file');

      expect(error.category).toBe('filesystem');
      expect(error.code).toBe('FS_READ_ERROR');
      expect(error.message).toBe('Cannot read file');
      expect(error.path).toBe('/test/file.txt');
      expect(error.operation).toBe('read');
    });

    it('should handle different operations', () => {
      const readError = fileSystemError('read', '/test', 'Read error');
      const writeError = fileSystemError('write', '/test', 'Write error');

      expect(readError.code).toBe('FS_READ_ERROR');
      expect(writeError.code).toBe('FS_WRITE_ERROR');
      expect(readError.recoverable).toBe(false);
      expect(writeError.recoverable).toBe(true);
    });
  });

  describe('fileNotFoundError', () => {
    it('should create file not found error', () => {
      const error = fileNotFoundError('/missing/file.txt');

      expect(error.category).toBe('filesystem');
      expect(error.code).toBe('FS_READ_ERROR');
      expect(error.message).toBe('File not found: /missing/file.txt');
      expect(error.path).toBe('/missing/file.txt');
      expect(error.operation).toBe('read');
      expect(error.errno).toBe(-2); // ENOENT
    });
  });

  describe('networkError', () => {
    it('should create basic network error', () => {
      const error = networkError('Connection failed');

      expect(error.category).toBe('network');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Connection failed');
      expect(error.recoverable).toBe(true);
    });

    it('should create network error with options', () => {
      const error = networkError('Download failed', {
        url: 'https://example.com/file.zip',
        statusCode: 404,
        suggestion: 'Check the URL',
      });

      expect(error.url).toBe('https://example.com/file.zip');
      expect(error.statusCode).toBe(404);
      expect(error.suggestion).toBe('Check the URL');
    });

    it('should create timeout error when timeout option is true', () => {
      const error = networkError('Request timed out', {
        timeout: true,
        url: 'https://slow.com',
      });

      expect(error.code).toBe('NETWORK_TIMEOUT');
      expect(error.timeout).toBe(true);
    });
  });

  describe('executionError', () => {
    it('should create basic execution error', () => {
      const error = executionError('Command failed');

      expect(error.category).toBe('execution');
      expect(error.code).toBe('EXEC_ERROR');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('userInputError', () => {
    it('should create basic user input error', () => {
      const error = userInputError('Invalid input');

      expect(error.category).toBe('user-input');
      expect(error.code).toBe('USER_INPUT_ERROR');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('dependencyError', () => {
    it('should create basic dependency error', () => {
      const error = dependencyError('Dependency not found');

      expect(error.category).toBe('dependency');
      expect(error.code).toBe('DEPENDENCY_ERROR');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle Result workflow', () => {
      // Create validation error
      const validationErr = invalidTypeError('port', 'number', 'abc');

      // Add severity
      const severityErr = createSeverityError(validationErr, 'error');

      // Wrap in Result
      const result = err(severityErr);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.category).toBe('validation');
        expect(result.error.severity).toBe('error');
        expect(result.error.field).toBe('port');
      }
    });

    it('should handle complex error creation', () => {
      const ioError = fileNotFoundError('/missing/config.json');
      const severityError = createSeverityError(ioError, 'critical');

      expect(severityError.category).toBe('filesystem');
      expect(severityError.severity).toBe('critical');
      expect(severityError.errno).toBe(-2);
      expect(severityError.suggestion).toBe('Check if the file exists and the path is correct');
    });

    it('should handle error hierarchy', () => {
      const baseError = createError('BASE_ERROR', 'Base error');
      const severityError = createSeverityError(baseError, 'warning');

      expect(severityError.code).toBe('BASE_ERROR');
      expect(severityError.message).toBe('Base error');
      expect(severityError.severity).toBe('warning');
      expect(severityError.recoverable).toBe(false); // Inherited from base
    });
  });
});
