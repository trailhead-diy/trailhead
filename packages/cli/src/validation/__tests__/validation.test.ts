import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhoneNumber,
  validateUrl,
  validateStringLength,
  validateNumberRange,
  validateRequired,
  validateCurrency,
  validateDate,
  validateArray,
  validateObject,
} from '../index.js';

describe('Validation Functions', () => {
  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      const result = validateEmail('test@example.com');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('test@example.com');
      }
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid email format');
      }
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isOk()).toBe(false);
      if (result.isErr()) {
        expect(result.error.message).toContain('Email is required');
      }
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate US phone number', () => {
      const result = validatePhoneNumber('(555) 123-4567');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('(555) 123-4567');
      }
    });

    it('should validate clean US phone number', () => {
      const result = validatePhoneNumber('5551234567');
      expect(result.isOk()).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const result = validatePhoneNumber('123');
      expect(result.isOk()).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URL', () => {
      const result = validateUrl('https://example.com');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('https://example.com');
      }
    });

    it('should reject invalid URL', () => {
      const result = validateUrl('not-a-url');
      expect(result.isOk()).toBe(false);
    });
  });

  describe('validateStringLength', () => {
    it('should validate string within length limits', () => {
      const result = validateStringLength('hello', 3, 10);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('hello');
      }
    });

    it('should reject string too short', () => {
      const result = validateStringLength('hi', 3, 10);
      expect(result.isOk()).toBe(false);
    });

    it('should reject string too long', () => {
      const result = validateStringLength('hello world!', 3, 10);
      expect(result.isOk()).toBe(false);
    });
  });

  describe('validateNumberRange', () => {
    it('should validate number within range', () => {
      const result = validateNumberRange(5, 1, 10);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(5);
      }
    });

    it('should reject number below minimum', () => {
      const result = validateNumberRange(0, 1, 10);
      expect(result.isOk()).toBe(false);
    });

    it('should reject number above maximum', () => {
      const result = validateNumberRange(15, 1, 10);
      expect(result.isOk()).toBe(false);
    });

    it('should reject non-number values', () => {
      const result = validateNumberRange('not-a-number' as any, 1, 10);
      expect(result.isOk()).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty value', () => {
      const result = validateRequired('hello');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('hello');
      }
    });

    it('should reject null value', () => {
      const result = validateRequired(null);
      expect(result.isOk()).toBe(false);
    });

    it('should reject undefined value', () => {
      const result = validateRequired(undefined);
      expect(result.isOk()).toBe(false);
    });

    it('should reject empty string', () => {
      const result = validateRequired('');
      expect(result.isOk()).toBe(false);
    });
  });

  describe('validateCurrency', () => {
    it('should validate positive currency amount', () => {
      const result = validateCurrency(19.99);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(19.99);
      }
    });

    it('should reject negative currency amount', () => {
      const result = validateCurrency(-5.0);
      expect(result.isOk()).toBe(false);
    });

    it('should reject currency with too many decimal places', () => {
      const result = validateCurrency(19.999);
      expect(result.isOk()).toBe(false);
    });

    it('should reject non-number currency', () => {
      const result = validateCurrency('not-a-number' as any);
      expect(result.isOk()).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate valid date string', () => {
      const result = validateDate('2023-12-25');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Date);
      }
    });

    it('should reject invalid date string', () => {
      const result = validateDate('invalid-date');
      expect(result.isOk()).toBe(false);
    });

    it('should reject empty date string', () => {
      const result = validateDate('');
      expect(result.isOk()).toBe(false);
    });
  });

  describe('validateArray', () => {
    it('should validate array with valid items', () => {
      const items = ['test@example.com', 'another@example.com'];
      const result = validateArray(items, validateEmail);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('should reject array with invalid items', () => {
      const items = ['test@example.com', 'invalid-email'];
      const result = validateArray(items, validateEmail);
      expect(result.isOk()).toBe(false);
    });

    it('should reject non-array value', () => {
      const result = validateArray('not-an-array' as any, validateEmail);
      expect(result.isOk()).toBe(false);
    });
  });

  describe('validateObject', () => {
    it('should validate object with valid fields', () => {
      const obj = { name: 'John', age: 30 };
      const validators = {
        name: (value: string) => validateStringLength(value, 1, 50),
        age: (value: number) => validateNumberRange(value, 0, 150),
      };

      const result = validateObject(obj, validators);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe('John');
        expect(result.value.age).toBe(30);
      }
    });

    it('should reject object with invalid fields', () => {
      const obj = { name: '', age: 30 };
      const validators = {
        name: (value: string) => validateStringLength(value, 1, 50),
        age: (value: number) => validateNumberRange(value, 0, 150),
      };

      const result = validateObject(obj, validators);
      expect(result.isOk()).toBe(false);
    });

    it('should reject non-object value', () => {
      const result = validateObject('not-an-object' as any, {});
      expect(result.isOk()).toBe(false);
    });
  });
});
