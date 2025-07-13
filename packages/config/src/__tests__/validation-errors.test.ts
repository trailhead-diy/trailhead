import { describe, it, expect } from 'vitest';
import {
  createConfigValidationError,
  createSchemaValidationError,
  createMissingFieldError,
  createTypeError,
  createEnumError,
  createRangeError,
  createLengthError,
  createPatternError,
  isConfigValidationError,
  isSchemaValidationError,
  type ConfigValidationError,
} from '../validation/errors.js';
import {
  createValidationErrorFormatter,
  formatValidationError,
  formatValidationErrors,
  formatValidationErrorsJson,
  extractValidationErrors,
  type FormatterOptions,
} from '../validation/formatters.js';

describe('ValidationError Creation', () => {
  it('should create a basic validation error', () => {
    const error = createConfigValidationError({
      field: 'username',
      value: 123,
      expectedType: 'string',
      suggestion: 'Provide a valid string value',
      examples: ['john-doe', 'user123'],
      path: ['user', 'profile'],
    });

    expect(error.type).toBe('VALIDATION_ERROR');
    expect(error.field).toBe('username');
    expect(error.value).toBe(123);
    expect(error.expectedType).toBe('string');
    expect(error.suggestion).toBe('Provide a valid string value');
    expect(error.examples).toEqual(['john-doe', 'user123']);
    expect(error.path).toEqual(['user', 'profile']);
    expect(error.message).toContain('username');
    expect(error.message).toContain('string');
  });

  it('should create a validation error with rule and constraints', () => {
    const error = createConfigValidationError({
      field: 'port',
      value: 70000,
      expectedType: 'number',
      suggestion: 'Port must be between 1 and 65535',
      rule: 'range',
      constraints: { min: 1, max: 65535 },
    });

    expect(error.code).toBe('range');
    expect(error.data).toEqual({ min: 1, max: 65535 });
    expect(error.message).toContain('[rule: range]');
  });

  it('should create a schema validation error with multiple nested errors', () => {
    const validationErrors: ConfigValidationError[] = [
      createMissingFieldError('name', 'string'),
      createTypeError('age', 'not a number', 'number'),
    ];

    const schemaError = createSchemaValidationError(validationErrors, 'UserConfig');

    expect(schemaError.type).toBe('SCHEMA_VALIDATION_FAILED');
    expect(schemaError.message).toContain('UserConfig');
    expect(schemaError.message).toContain('2 error');
    expect(schemaError.context?.errors).toHaveLength(2);
  });
});

describe('Specific Error Factories', () => {
  it('should create missing field error', () => {
    const error = createMissingFieldError('apiKey', 'string', ['auth']);

    expect(error.field).toBe('apiKey');
    expect(error.value).toBeUndefined();
    expect(error.expectedType).toBe('string');
    expect(error.code).toBe('required');
    expect(error.path).toEqual(['auth']);
    expect(error.suggestion).toContain('Add required field "apiKey"');
  });

  it('should create type error', () => {
    const error = createTypeError('count', 'invalid', 'number', ['stats']);

    expect(error.field).toBe('count');
    expect(error.value).toBe('invalid');
    expect(error.expectedType).toBe('number');
    expect(error.code).toBe('type');
    expect(error.path).toEqual(['stats']);
    expect(error.suggestion).toContain('valid number');
  });

  it('should create enum error', () => {
    const allowedValues = ['debug', 'info', 'warn', 'error'] as const;
    const error = createEnumError('logLevel', 'trace', allowedValues);

    expect(error.field).toBe('logLevel');
    expect(error.value).toBe('trace');
    expect(error.expectedType).toBe('enum');
    expect(error.code).toBe('enum');
    expect(error.examples).toEqual(allowedValues);
    expect(error.suggestion).toContain('debug');
    expect(error.suggestion).toContain('info');
  });

  it('should create range error with min and max', () => {
    const error = createRangeError('timeout', 5000, 100, 3000);

    expect(error.field).toBe('timeout');
    expect(error.value).toBe(5000);
    expect(error.expectedType).toBe('number');
    expect(error.code).toBe('range');
    expect(error.data).toEqual({ min: 100, max: 3000 });
    expect(error.suggestion).toContain('between 100 and 3000');
    expect(error.examples).toHaveLength(3); // min, middle, max
  });

  it('should create range error with only minimum', () => {
    const error = createRangeError('port', -1, 1);

    expect(error.suggestion).toContain('at least 1');
    expect(error.data).toEqual({ min: 1, max: undefined });
  });

  it('should create length error', () => {
    const error = createLengthError('password', 'abc', 8, 64);

    expect(error.field).toBe('password');
    expect(error.value).toBe('abc');
    expect(error.expectedType).toBe('string');
    expect(error.code).toBe('length');
    expect(error.data).toEqual({ minLength: 8, maxLength: 64 });
    expect(error.suggestion).toContain('between 8 and 64 characters');
  });

  it('should create pattern error', () => {
    const error = createPatternError(
      'email',
      'invalid-email',
      '^[^@]+@[^@]+$',
      'Valid email format'
    );

    expect(error.field).toBe('email');
    expect(error.value).toBe('invalid-email');
    expect(error.expectedType).toBe('string');
    expect(error.code).toBe('pattern');
    expect(error.data?.pattern).toBe('^[^@]+@[^@]+$');
    expect(error.suggestion).toBe('Valid email format');
  });
});

describe('Error Predicates', () => {
  it('should identify validation errors', () => {
    const validationError = createConfigValidationError({
      field: 'test',
      value: 'test',
      expectedType: 'number',
      suggestion: 'Test suggestion',
    });

    const regularError = new Error('Regular error');

    expect(isConfigValidationError(validationError)).toBe(true);
    expect(isConfigValidationError(regularError)).toBe(false);
    expect(isConfigValidationError(null)).toBe(false);
    expect(isConfigValidationError(undefined)).toBe(false);
  });

  it('should identify schema validation errors', () => {
    const schemaError = createSchemaValidationError([], 'TestSchema');
    const regularError = new Error('Regular error');

    expect(isSchemaValidationError(schemaError)).toBe(true);
    expect(isSchemaValidationError(regularError)).toBe(false);
  });
});

describe('Error Formatting', () => {
  const sampleError = createConfigValidationError({
    field: 'database.port',
    value: 'invalid',
    expectedType: 'number',
    suggestion: 'Provide a valid port number between 1 and 65535',
    examples: [3306, 5432, 27017],
    path: ['database'],
    rule: 'type',
  });

  describe('Single Error Formatting', () => {
    it('should format error with colors by default', () => {
      const formatted = formatValidationError(sampleError);

      expect(formatted).toContain('database.port');
      expect(formatted).toContain('number');
      expect(formatted).toContain('Suggestion:');
      expect(formatted).toContain('Examples:');
      expect(formatted).toContain('3306');
      expect(formatted).toContain('\x1b['); // ANSI color codes
    });

    it('should format error without colors', () => {
      const formatted = formatValidationError(sampleError, { includeColors: false });

      expect(formatted).toContain('database.port');
      expect(formatted).toContain('number');
      expect(formatted).not.toContain('\x1b['); // No ANSI color codes
    });

    it('should format error in compact mode', () => {
      const formatted = formatValidationError(sampleError, { compact: true });

      expect(formatted).toBe(
        'database.database.port: Provide a valid port number between 1 and 65535'
      );
      expect(formatted).not.toContain('Suggestion:');
      expect(formatted).not.toContain('Examples:');
    });

    it('should exclude examples when configured', () => {
      const formatted = formatValidationError(sampleError, { includeExamples: false });

      expect(formatted).toContain('Suggestion:');
      expect(formatted).not.toContain('Examples:');
      expect(formatted).not.toContain('3306');
    });

    it('should limit number of examples', () => {
      const formatted = formatValidationError(sampleError, { maxExamples: 2 });

      expect(formatted).toContain('3306');
      expect(formatted).toContain('5432');
      expect(formatted).not.toContain('27017');
    });
  });

  describe('Multiple Errors Formatting', () => {
    const errors = [
      createMissingFieldError('name', 'string'),
      createTypeError('age', 'invalid', 'number'),
      createEnumError('role', 'invalid', ['admin', 'user']),
    ];

    it('should format multiple errors with numbering', () => {
      const formatted = formatValidationErrors(errors);

      expect(formatted).toContain('Found 3 configuration errors');
      expect(formatted).toContain('1.');
      expect(formatted).toContain('2.');
      expect(formatted).toContain('3.');
      expect(formatted).toContain('name');
      expect(formatted).toContain('age');
      expect(formatted).toContain('role');
    });

    it('should format single error without numbering', () => {
      const formatted = formatValidationErrors([errors[0]]);

      expect(formatted).not.toContain('Found 1 configuration');
      expect(formatted).not.toContain('1.');
      expect(formatted).toContain('name');
    });

    it('should handle empty error array', () => {
      const formatted = formatValidationErrors([]);

      expect(formatted).toBe('No validation errors found.');
    });
  });

  describe('Error Summary Formatting', () => {
    it('should create error summary with statistics', () => {
      const formatter = createValidationErrorFormatter();
      const errors = [
        createMissingFieldError('name', 'string'),
        createMissingFieldError('email', 'string'),
        createTypeError('age', 'invalid', 'number'),
      ];

      const summary = formatter.formatErrorsSummary(errors);

      expect(summary).toContain('3 errors');
      expect(summary).toContain('Error Types:');
      expect(summary).toContain('required: 2');
      expect(summary).toContain('type: 1');
      expect(summary).toContain('Affected Fields:');
    });

    it('should handle valid configuration', () => {
      const formatter = createValidationErrorFormatter();
      const summary = formatter.formatErrorsSummary([]);

      expect(summary).toBe('Configuration is valid ✓');
    });
  });

  describe('Interactive Formatting', () => {
    it('should create interactive error info', () => {
      const formatter = createValidationErrorFormatter();
      const interactive = formatter.formatInteractive(sampleError);

      expect(interactive.title).toContain('database.port');
      expect(interactive.description).toBe(sampleError.message);
      expect(interactive.suggestion).toBe(sampleError.suggestion);
      expect(interactive.examples).toHaveLength(3);
      expect(interactive.fixCommand).toContain('config set');
      expect(interactive.learnMoreUrl).toContain('type');
    });

    it('should generate fix commands for different error types', () => {
      const formatter = createValidationErrorFormatter();

      const requiredError = createMissingFieldError('apiKey', 'string');
      const requiredInteractive = formatter.formatInteractive(requiredError);
      expect(requiredInteractive.fixCommand).toContain('config set apiKey <value>');

      const enumError = createEnumError('env', 'invalid', ['dev', 'prod']);
      const enumInteractive = formatter.formatInteractive(enumError);
      expect(enumInteractive.fixCommand).toContain('config set env "dev"');
    });
  });

  describe('JSON Formatting', () => {
    it('should format error as JSON', () => {
      const formatter = createValidationErrorFormatter();
      const json = formatter.formatJson(sampleError);

      expect(json.field).toBe('database.port');
      expect(json.path).toEqual(['database']);
      expect(json.value).toBe('invalid');
      expect(json.expectedType).toBe('number');
      expect(json.rule).toBe('type');
      expect(json.message).toBe(sampleError.message);
      expect(json.suggestion).toBe(sampleError.suggestion);
      expect(json.examples).toEqual(sampleError.examples);
    });

    it('should format multiple errors as JSON array', () => {
      const errors = [
        createMissingFieldError('name', 'string'),
        createTypeError('age', 'invalid', 'number'),
      ];

      const jsonArray = formatValidationErrorsJson(errors);

      expect(jsonArray).toHaveLength(2);
      expect(jsonArray[0].field).toBe('name');
      expect(jsonArray[1].field).toBe('age');
    });
  });
});

describe('Error Extraction', () => {
  it('should extract validation error from single error', () => {
    const validationError = createConfigValidationError({
      field: 'test',
      value: 'test',
      expectedType: 'number',
      suggestion: 'Test suggestion',
    });

    const extracted = extractValidationErrors(validationError);

    expect(extracted).toHaveLength(1);
    expect(extracted[0]).toBe(validationError);
  });

  it('should extract validation errors from schema error', () => {
    const validationErrors = [
      createMissingFieldError('name', 'string'),
      createTypeError('age', 'invalid', 'number'),
    ];
    const schemaError = createSchemaValidationError(validationErrors);

    const extracted = extractValidationErrors(schemaError);

    expect(extracted).toHaveLength(2);
    expect(extracted[0].field).toBe('name');
    expect(extracted[1].field).toBe('age');
  });

  it('should return empty array for non-validation errors', () => {
    const regularError = new Error('Regular error');
    const extracted = extractValidationErrors(regularError);

    expect(extracted).toHaveLength(0);
  });

  it('should handle null and undefined', () => {
    expect(extractValidationErrors(null)).toHaveLength(0);
    expect(extractValidationErrors(undefined)).toHaveLength(0);
  });
});

describe('Value Serialization', () => {
  it('should handle various value types in error messages', () => {
    const testCases = [
      { value: undefined, expected: 'undefined' },
      { value: null, expected: 'null' },
      { value: 'string', expected: '"string"' },
      { value: 123, expected: '123' },
      { value: true, expected: 'true' },
      { value: [1, 2, 3], expected: '[1,2,3]' },
      { value: { key: 'value' }, expected: '{"key":"value"}' },
      { value: new Date('2023-01-01'), expected: '2023-01-01T00:00:00.000Z' },
    ];

    testCases.forEach(({ value, expected }) => {
      const error = createConfigValidationError({
        field: 'test',
        value,
        expectedType: 'string',
        suggestion: 'Test',
      });

      if (expected.includes('Z')) {
        // For dates, just check it contains ISO format
        expect(error.message).toContain('T');
        expect(error.message).toContain('Z');
      } else {
        expect(error.message).toContain(expected);
      }
    });
  });

  it('should handle circular references safely', () => {
    const circular: any = { name: 'test' };
    circular.self = circular;

    const error = createConfigValidationError({
      field: 'test',
      value: circular,
      expectedType: 'string',
      suggestion: 'Test',
    });

    expect(error.message).toContain('[Circular Reference]');
  });

  it('should handle functions and symbols', () => {
    const func = () => 'test';
    const symbol = Symbol('test');

    const funcError = createConfigValidationError({
      field: 'func',
      value: func,
      expectedType: 'string',
      suggestion: 'Test',
    });

    const symbolError = createConfigValidationError({
      field: 'symbol',
      value: symbol,
      expectedType: 'string',
      suggestion: 'Test',
    });

    expect(funcError.message).toContain('[Function]');
    expect(symbolError.message).toContain('Symbol(test)');
  });
});
