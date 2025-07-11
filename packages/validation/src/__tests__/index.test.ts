import { describe, it, expect } from 'vitest';
import { validate } from '../index.js';

describe('Validation Index Exports', () => {
  it('should export convenience validate object with all operations', () => {
    expect(validate).toBeDefined();
    expect(typeof validate.email).toBe('function');
    expect(typeof validate.url).toBe('function');
    expect(typeof validate.phoneNumber).toBe('function');
    expect(typeof validate.stringLength).toBe('function');
    expect(typeof validate.numberRange).toBe('function');
    expect(typeof validate.required).toBe('function');
    expect(typeof validate.currency).toBe('function');
    expect(typeof validate.date).toBe('function');
    expect(typeof validate.array).toBe('function');
    expect(typeof validate.object).toBe('function');
  });

  it('should provide functions that work with default config', () => {
    // Test email validation
    const emailResult = validate.email('test@example.com');
    expect(emailResult.isOk()).toBe(true);

    // Test url validation
    const urlResult = validate.url('https://example.com');
    expect(urlResult.isOk()).toBe(true);

    // Test phone validation
    const phoneResult = validate.phoneNumber('1234567890');
    expect(phoneResult.isOk()).toBe(true);

    // Test required validation
    const requiredResult = validate.required('value');
    expect(requiredResult.isOk()).toBe(true);

    // Test currency validation
    const currencyResult = validate.currency(99.99);
    expect(currencyResult.isOk()).toBe(true);
  });

  it('should provide parameterized validation functions', () => {
    // Test string length validation
    const stringLengthValidator = validate.stringLength(5, 10);
    const lengthResult = stringLengthValidator('hello');
    expect(lengthResult.isOk()).toBe(true);

    // Test number range validation
    const numberRangeValidator = validate.numberRange(0, 100);
    const rangeResult = numberRangeValidator(50);
    expect(rangeResult.isOk()).toBe(true);
  });

  it('should handle validation failures', () => {
    // Test invalid email
    const emailResult = validate.email('invalid-email');
    expect(emailResult.isErr()).toBe(true);
    if (emailResult.isErr()) {
      expect(emailResult.error.type).toBe('VALIDATION_ERROR');
    }

    // Test invalid URL
    const urlResult = validate.url('not-a-url');
    expect(urlResult.isErr()).toBe(true);

    // Test invalid phone
    const phoneResult = validate.phoneNumber('123');
    expect(phoneResult.isErr()).toBe(true);

    // Test required validation failure
    const requiredResult = validate.required(null);
    expect(requiredResult.isErr()).toBe(true);
  });
});
