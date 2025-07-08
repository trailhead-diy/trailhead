import { describe, it, expect } from 'vitest';
import {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isNonEmptyString,
  isStringArray,
  string,
  nonEmptyString,
  number,
  boolean,
  object,
  array,
  stringArray,
  field,
  createValidator,
  pattern,
  stringLength,
  numberRange,
  enumValue,
  optional,
  withDefault,
} from '../base.js';

describe('Validation Base', () => {
  describe('type guards', () => {
    describe('isString', () => {
      it('should return true for strings', () => {
        expect(isString('hello')).toBe(true);
        expect(isString('')).toBe(true);
        expect(isString('123')).toBe(true);
      });

      it('should return false for non-strings', () => {
        expect(isString(123)).toBe(false);
        expect(isString(true)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString({})).toBe(false);
        expect(isString([])).toBe(false);
      });
    });

    describe('isNumber', () => {
      it('should return true for valid numbers', () => {
        expect(isNumber(123)).toBe(true);
        expect(isNumber(0)).toBe(true);
        expect(isNumber(-42)).toBe(true);
        expect(isNumber(3.14)).toBe(true);
      });

      it('should return false for NaN and non-numbers', () => {
        expect(isNumber(NaN)).toBe(false);
        expect(isNumber('123')).toBe(false);
        expect(isNumber(true)).toBe(false);
        expect(isNumber(null)).toBe(false);
        expect(isNumber(undefined)).toBe(false);
      });
    });

    describe('isBoolean', () => {
      it('should return true for booleans', () => {
        expect(isBoolean(true)).toBe(true);
        expect(isBoolean(false)).toBe(true);
      });

      it('should return false for non-booleans', () => {
        expect(isBoolean('true')).toBe(false);
        expect(isBoolean(1)).toBe(false);
        expect(isBoolean(0)).toBe(false);
        expect(isBoolean(null)).toBe(false);
        expect(isBoolean(undefined)).toBe(false);
      });
    });

    describe('isObject', () => {
      it('should return true for plain objects', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ key: 'value' })).toBe(true);
        expect(isObject(Object.create(null))).toBe(true);
      });

      it('should return false for non-objects', () => {
        expect(isObject(null)).toBe(false);
        expect(isObject([])).toBe(false);
        expect(isObject('string')).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(true)).toBe(false);
        expect(isObject(undefined)).toBe(false);
      });
    });

    describe('isArray', () => {
      it('should return true for arrays', () => {
        expect(isArray([])).toBe(true);
        expect(isArray([1, 2, 3])).toBe(true);
        expect(isArray(['a', 'b'])).toBe(true);
      });

      it('should return false for non-arrays', () => {
        expect(isArray({})).toBe(false);
        expect(isArray('string')).toBe(false);
        expect(isArray(123)).toBe(false);
        expect(isArray(null)).toBe(false);
        expect(isArray(undefined)).toBe(false);
      });
    });

    describe('isNonEmptyString', () => {
      it('should return true for non-empty strings', () => {
        expect(isNonEmptyString('hello')).toBe(true);
        expect(isNonEmptyString('a')).toBe(true);
        expect(isNonEmptyString('  text  ')).toBe(true);
      });

      it('should return false for empty or whitespace-only strings', () => {
        expect(isNonEmptyString('')).toBe(false);
        expect(isNonEmptyString('   ')).toBe(false);
        expect(isNonEmptyString('\t\n')).toBe(false);
      });

      it('should return false for non-strings', () => {
        expect(isNonEmptyString(123)).toBe(false);
        expect(isNonEmptyString(null)).toBe(false);
        expect(isNonEmptyString(undefined)).toBe(false);
      });
    });

    describe('isStringArray', () => {
      it('should return true for string arrays', () => {
        expect(isStringArray([])).toBe(true);
        expect(isStringArray(['a', 'b', 'c'])).toBe(true);
        expect(isStringArray([''])).toBe(true);
      });

      it('should return false for arrays with non-strings', () => {
        expect(isStringArray([1, 2, 3])).toBe(false);
        expect(isStringArray(['a', 1, 'b'])).toBe(false);
        expect(isStringArray([null])).toBe(false);
      });

      it('should return false for non-arrays', () => {
        expect(isStringArray('string')).toBe(false);
        expect(isStringArray({})).toBe(false);
        expect(isStringArray(123)).toBe(false);
      });
    });
  });

  describe('basic validators', () => {
    describe('string', () => {
      it('should validate string values', () => {
        const validator = string();

        const result = validator('hello');
        expect(result.success).toBe(true);
        expect(result.value).toBe('hello');
      });

      it('should reject non-string values', () => {
        const validator = string('name');

        const result = validator(123);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('name must be a string');
        expect(result.error.field).toBe('name');
      });

      it('should use default field name', () => {
        const validator = string();

        const result = validator(123);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Value must be a string');
      });
    });

    describe('nonEmptyString', () => {
      it('should validate non-empty strings', () => {
        const validator = nonEmptyString();

        const result = validator('hello');
        expect(result.success).toBe(true);
        expect(result.value).toBe('hello');
      });

      it('should reject empty strings', () => {
        const validator = nonEmptyString('title');

        const result = validator('');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('title must be a non-empty string');
      });

      it('should reject whitespace-only strings', () => {
        const validator = nonEmptyString();

        const result = validator('   ');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Value must be a non-empty string');
      });
    });

    describe('number', () => {
      it('should validate number values', () => {
        const validator = number();

        const result = validator(42);
        expect(result.success).toBe(true);
        expect(result.value).toBe(42);
      });

      it('should reject non-number values', () => {
        const validator = number('age');

        const result = validator('42');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('age must be a number');
      });

      it('should reject NaN', () => {
        const validator = number();

        const result = validator(NaN);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Value must be a number');
      });
    });

    describe('boolean', () => {
      it('should validate boolean values', () => {
        const validator = boolean();

        const trueResult = validator(true);
        expect(trueResult.success).toBe(true);
        expect(trueResult.value).toBe(true);

        const falseResult = validator(false);
        expect(falseResult.success).toBe(true);
        expect(falseResult.value).toBe(false);
      });

      it('should reject non-boolean values', () => {
        const validator = boolean('enabled');

        const result = validator('true');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('enabled must be a boolean');
      });
    });

    describe('object', () => {
      it('should validate object values', () => {
        const validator = object();

        const result = validator({ key: 'value' });
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ key: 'value' });
      });

      it('should reject non-object values', () => {
        const validator = object('config');

        const result = validator([]);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('config must be an object');
      });

      it('should reject null', () => {
        const validator = object();

        const result = validator(null);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Value must be an object');
      });
    });

    describe('array', () => {
      it('should validate array without item validator', () => {
        const validator = array();

        const result = validator([1, 'two', true]);
        expect(result.success).toBe(true);
        expect(result.value).toEqual([1, 'two', true]);
      });

      it('should validate array with item validator', () => {
        const validator = array(string(), 'names');

        const result = validator(['alice', 'bob', 'charlie']);
        expect(result.success).toBe(true);
        expect(result.value).toEqual(['alice', 'bob', 'charlie']);
      });

      it('should reject invalid items', () => {
        const validator = array(string(), 'names');

        const result = validator(['alice', 123, 'charlie']);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('names[1]: Value must be a string');
        expect(result.error.field).toBe('names[1]');
      });

      it('should reject non-array values', () => {
        const validator = array(string(), 'items');

        const result = validator('not an array');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('items must be an array');
      });
    });

    describe('stringArray', () => {
      it('should validate string arrays', () => {
        const validator = stringArray('tags');

        const result = validator(['tag1', 'tag2', 'tag3']);
        expect(result.success).toBe(true);
        expect(result.value).toEqual(['tag1', 'tag2', 'tag3']);
      });

      it('should reject arrays with non-strings', () => {
        const validator = stringArray('tags');

        const result = validator(['tag1', 123, 'tag3']);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('tags[1]: Value must be a string');
      });
    });
  });

  describe('createValidator', () => {
    it('should create composable validator', () => {
      const validator = createValidator(string());

      const result = validator.validate('hello');
      expect(result.success).toBe(true);
      expect(result.value).toBe('hello');
    });

    describe('and composition', () => {
      it('should combine validators with and', () => {
        const nameValidator = createValidator(field('name', string('name')));
        const ageValidator = createValidator(field('age', number('age')));

        const combined = nameValidator.and(ageValidator);

        const result = combined.validate({ name: 'Alice', age: 30 });
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ name: 'Alice', age: 30 });
      });

      it('should fail if first validator fails', () => {
        const nameValidator = createValidator(field('name', string('name')));
        const ageValidator = createValidator(field('age', number('age')));

        const combined = nameValidator.and(ageValidator);

        const result = combined.validate({ name: 123, age: 30 });
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('name must be a string');
      });

      it('should fail if second validator fails', () => {
        const nameValidator = createValidator(field('name', string('name')));
        const ageValidator = createValidator(field('age', number('age')));

        const combined = nameValidator.and(ageValidator);

        const result = combined.validate({ name: 'Alice', age: 'thirty' });
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('age must be a number');
      });
    });

    describe('or composition', () => {
      it('should accept if first validator passes', () => {
        const stringValidator = createValidator(string());
        const numberValidator = createValidator(number());

        const combined = stringValidator.or(numberValidator);

        const result = combined.validate('hello');
        expect(result.success).toBe(true);
        expect(result.value).toBe('hello');
      });

      it('should accept if second validator passes', () => {
        const stringValidator = createValidator(string());
        const numberValidator = createValidator(number());

        const combined = stringValidator.or(numberValidator);

        const result = combined.validate(42);
        expect(result.success).toBe(true);
        expect(result.value).toBe(42);
      });

      it('should fail if both validators fail', () => {
        const stringValidator = createValidator(string());
        const numberValidator = createValidator(number());

        const combined = stringValidator.or(numberValidator);

        const result = combined.validate(true);
        expect(result.success).toBe(false);
        expect(result.error.message).toContain('Neither validation passed');
      });
    });

    describe('map transformation', () => {
      it('should transform successful values', () => {
        const stringValidator = createValidator(string());
        const upperCaseValidator = stringValidator.map(s => s.toUpperCase());

        const result = upperCaseValidator.validate('hello');
        expect(result.success).toBe(true);
        expect(result.value).toBe('HELLO');
      });

      it('should handle transformation errors', () => {
        const stringValidator = createValidator(string());
        const errorValidator = stringValidator.map(() => {
          throw new Error('Transform failed');
        });

        const result = errorValidator.validate('hello');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Mapping failed: Transform failed');
      });

      it('should pass through validation errors', () => {
        const stringValidator = createValidator(string());
        const upperCaseValidator = stringValidator.map(s => s.toUpperCase());

        const result = upperCaseValidator.validate(123);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Value must be a string');
      });
    });

    describe('mapError transformation', () => {
      it('should transform error messages', () => {
        const stringValidator = createValidator(string());
        const customErrorValidator = stringValidator.mapError(error => ({
          ...error,
          message: `Custom: ${error.message}`,
        }));

        const result = customErrorValidator.validate(123);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Custom: Value must be a string');
      });

      it('should pass through successful results', () => {
        const stringValidator = createValidator(string());
        const customErrorValidator = stringValidator.mapError(error => ({
          ...error,
          message: `Custom: ${error.message}`,
        }));

        const result = customErrorValidator.validate('hello');
        expect(result.success).toBe(true);
        expect(result.value).toBe('hello');
      });
    });
  });

  describe('specialized validators', () => {
    describe('pattern', () => {
      it('should validate strings matching pattern', () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validator = pattern(emailPattern, 'Invalid email format', 'email');

        const result = validator('user@example.com');
        expect(result.success).toBe(true);
        expect(result.value).toBe('user@example.com');
      });

      it('should reject strings not matching pattern', () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validator = pattern(emailPattern, 'Invalid email format', 'email');

        const result = validator('invalid-email');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Invalid email format');
        expect(result.error.field).toBe('email');
      });

      it('should reject non-strings', () => {
        const numberPattern = /^\d+$/;
        const validator = pattern(numberPattern, 'Must be digits');

        const result = validator(123);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Value must be a string');
      });
    });

    describe('stringLength', () => {
      it('should validate string within length constraints', () => {
        const validator = stringLength(3, 10, 'username');

        const result = validator('alice');
        expect(result.success).toBe(true);
        expect(result.value).toBe('alice');
      });

      it('should reject strings too short', () => {
        const validator = stringLength(3, 10, 'username');

        const result = validator('ab');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('username must be at least 3 characters');
      });

      it('should reject strings too long', () => {
        const validator = stringLength(3, 10, 'username');

        const result = validator('verylongusername');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('username must be at most 10 characters');
      });

      it('should handle min-only constraint', () => {
        const validator = stringLength(5);

        const validResult = validator('hello');
        expect(validResult.success).toBe(true);

        const invalidResult = validator('hi');
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.error.message).toBe('String must be at least 5 characters');
      });

      it('should handle max-only constraint', () => {
        const validator = stringLength(undefined, 5);

        const validResult = validator('hello');
        expect(validResult.success).toBe(true);

        const invalidResult = validator('toolong');
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.error.message).toBe('String must be at most 5 characters');
      });
    });

    describe('numberRange', () => {
      it('should validate numbers within range', () => {
        const validator = numberRange(0, 100, 'percentage');

        const result = validator(50);
        expect(result.success).toBe(true);
        expect(result.value).toBe(50);
      });

      it('should reject numbers below minimum', () => {
        const validator = numberRange(0, 100, 'percentage');

        const result = validator(-10);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('percentage must be at least 0');
      });

      it('should reject numbers above maximum', () => {
        const validator = numberRange(0, 100, 'percentage');

        const result = validator(150);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('percentage must be at most 100');
      });

      it('should handle min-only constraint', () => {
        const validator = numberRange(18);

        const validResult = validator(25);
        expect(validResult.success).toBe(true);

        const invalidResult = validator(16);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.error.message).toBe('Number must be at least 18');
      });
    });

    describe('enumValue', () => {
      it('should validate enum values', () => {
        const colors = ['red', 'green', 'blue'] as const;
        const validator = enumValue(colors, 'color');

        const result = validator('red');
        expect(result.success).toBe(true);
        expect(result.value).toBe('red');
      });

      it('should reject invalid enum values', () => {
        const colors = ['red', 'green', 'blue'] as const;
        const validator = enumValue(colors, 'color');

        const result = validator('yellow');
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('color must be one of: red, green, blue');
      });

      it('should reject non-strings', () => {
        const colors = ['red', 'green', 'blue'] as const;
        const validator = enumValue(colors);

        const result = validator(1);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Value must be a string');
      });
    });

    describe('optional', () => {
      it('should accept undefined values', () => {
        const validator = optional(string());

        const result = validator(undefined);
        expect(result.success).toBe(true);
        expect(result.value).toBe(undefined);
      });

      it('should accept null values as undefined', () => {
        const validator = optional(string());

        const result = validator(null);
        expect(result.success).toBe(true);
        expect(result.value).toBe(undefined);
      });

      it('should validate non-undefined values', () => {
        const validator = optional(string());

        const result = validator('hello');
        expect(result.success).toBe(true);
        expect(result.value).toBe('hello');
      });

      it('should fail for invalid non-undefined values', () => {
        const validator = optional(string());

        const result = validator(123);
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Value must be a string');
      });
    });

    describe('withDefault', () => {
      it('should use default for undefined values', () => {
        const validator = withDefault(string(), 'default');

        const result = validator(undefined);
        expect(result.success).toBe(true);
        expect(result.value).toBe('default');
      });

      it('should use default for null values', () => {
        const validator = withDefault(string(), 'default');

        const result = validator(null);
        expect(result.success).toBe(true);
        expect(result.value).toBe('default');
      });

      it('should use default for validation failures', () => {
        const validator = withDefault(string(), 'default');

        const result = validator(123);
        expect(result.success).toBe(true);
        expect(result.value).toBe('default');
      });

      it('should validate non-undefined/null values', () => {
        const validator = withDefault(string(), 'default');

        const result = validator('actual');
        expect(result.success).toBe(true);
        expect(result.value).toBe('actual');
      });
    });
  });

  describe('complex validation scenarios', () => {
    it('should handle nested object validation', () => {
      const userValidator = createValidator((value: unknown) => {
        if (!isObject(value)) {
          return { success: false, error: { message: 'Must be object' } };
        }

        const nameResult = string('name')(value.name);
        if (!nameResult.success) return nameResult;

        const ageResult = numberRange(0, 150, 'age')(value.age);
        if (!ageResult.success) return ageResult;

        const tagsResult = optional(stringArray('tags'))(value.tags);
        if (!tagsResult.success) return tagsResult;

        return {
          success: true,
          value: {
            name: nameResult.value,
            age: ageResult.value,
            tags: tagsResult.value,
          },
        };
      });

      const validResult = userValidator.validate({
        name: 'Alice',
        age: 30,
        tags: ['developer', 'typescript'],
      });

      expect(validResult.success).toBe(true);
      expect(validResult.value).toEqual({
        name: 'Alice',
        age: 30,
        tags: ['developer', 'typescript'],
      });

      const invalidResult = userValidator.validate({
        name: 'Alice',
        age: 200, // Invalid age
        tags: ['developer'],
      });

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error.message).toBe('age must be at most 150');
    });

    it('should handle validator composition chains', () => {
      const emailValidator = createValidator(
        pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format', 'email')
      );

      const lowercaseEmailValidator = emailValidator.map(email => email.toLowerCase());

      const result = lowercaseEmailValidator.validate('USER@EXAMPLE.COM');
      expect(result.success).toBe(true);
      expect(result.value).toBe('user@example.com');
    });

    it('should handle union types with or composition', () => {
      const stringOrNumberValidator = createValidator(string()).or(createValidator(number()));

      const stringResult = stringOrNumberValidator.validate('hello');
      expect(stringResult.success).toBe(true);
      expect(stringResult.value).toBe('hello');

      const numberResult = stringOrNumberValidator.validate(42);
      expect(numberResult.success).toBe(true);
      expect(numberResult.value).toBe(42);

      const booleanResult = stringOrNumberValidator.validate(true);
      expect(booleanResult.success).toBe(false);
    });
  });
});
