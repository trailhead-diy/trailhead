import type {
  Result,
  ValidationError,
  Validator,
  ComposableValidator,
} from './types.js';
import { Ok, Err } from './types.js';

export const isString = (value: unknown): value is string =>
  typeof value === 'string';

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

export const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const isArray = (value: unknown): value is unknown[] =>
  Array.isArray(value);

export const isNonEmptyString = (value: unknown): value is string =>
  isString(value) && value.trim().length > 0;

export const isStringArray = (value: unknown): value is string[] =>
  isArray(value) && value.every(isString);

/**
 * Create a string validator
 */
export const string =
  (field?: string): Validator<string> =>
  (value) => {
    if (!isString(value)) {
      return Err(`${field || 'Value'} must be a string`, field);
    }
    return Ok(value);
  };

/**
 * Create a non-empty string validator
 */
export const nonEmptyString =
  (field?: string): Validator<string> =>
  (value) => {
    if (!isNonEmptyString(value)) {
      return Err(`${field || 'Value'} must be a non-empty string`, field);
    }
    return Ok(value);
  };

/**
 * Create a number validator
 */
export const number =
  (field?: string): Validator<number> =>
  (value) => {
    if (!isNumber(value)) {
      return Err(`${field || 'Value'} must be a number`, field);
    }
    return Ok(value);
  };

/**
 * Create a boolean validator
 */
export const boolean =
  (field?: string): Validator<boolean> =>
  (value) => {
    if (!isBoolean(value)) {
      return Err(`${field || 'Value'} must be a boolean`, field);
    }
    return Ok(value);
  };

/**
 * Create an object validator
 */
export const object =
  (field?: string): Validator<Record<string, unknown>> =>
  (value) => {
    if (!isObject(value)) {
      return Err(`${field || 'Value'} must be an object`, field);
    }
    return Ok(value);
  };

/**
 * Create an array validator
 */
export const array =
  <T>(itemValidator?: Validator<T>, field?: string): Validator<T[]> =>
  (value) => {
    if (!isArray(value)) {
      return Err(`${field || 'Value'} must be an array`, field);
    }

    if (!itemValidator) {
      return Ok(value as T[]);
    }

    const results: T[] = [];
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i]);
      if (!result.success) {
        return Err(
          `${field || 'Array'}[${i}]: ${result.error.message}`,
          `${field || 'array'}[${i}]`,
        );
      }
      results.push(result.value);
    }

    return Ok(results);
  };

/**
 * Create a string array validator
 */
export const stringArray = (field?: string): Validator<string[]> =>
  array(string(), field);

/**
 * Create a composable validator
 */
export function createValidator<T>(
  validator: Validator<T>,
): ComposableValidator<T> {
  return {
    validate: validator,

    and<U>(other: Validator<U>): ComposableValidator<T & U> {
      return createValidator((value) => {
        const result1 = validator(value);
        if (!result1.success) return result1;

        const result2 = other(value);
        if (!result2.success) return result2;

        return Ok({ ...result1.value, ...result2.value } as T & U);
      });
    },

    or<U>(other: Validator<U>): ComposableValidator<T | U> {
      return createValidator((value) => {
        const result1 = validator(value);
        if (result1.success) return result1 as Result<T | U, ValidationError>;

        const result2 = other(value);
        if (result2.success) return result2 as Result<T | U, ValidationError>;

        return Err(
          `Neither validation passed: ${result1.error.message} OR ${result2.error.message}`,
        );
      });
    },

    map<U>(fn: (value: T) => U): ComposableValidator<U> {
      return createValidator((value) => {
        const result = validator(value);
        if (!result.success) return result;

        try {
          return Ok(fn(result.value));
        } catch (error) {
          return Err(
            `Mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      });
    },

    mapError(
      fn: (error: ValidationError) => ValidationError,
    ): ComposableValidator<T> {
      return createValidator((value) => {
        const result = validator(value);
        if (result.success) return result;

        return { success: false, error: fn(result.error) };
      });
    },
  };
}

/**
 * Validate string matches pattern
 */
export const pattern =
  (regex: RegExp, message: string, field?: string): Validator<string> =>
  (value) => {
    const stringResult = string(field)(value);
    if (!stringResult.success) return stringResult;

    if (!regex.test(stringResult.value)) {
      return Err(message, field);
    }

    return Ok(stringResult.value);
  };

/**
 * Validate string length constraints
 */
export const stringLength =
  (min?: number, max?: number, field?: string): Validator<string> =>
  (value) => {
    const stringResult = string(field)(value);
    if (!stringResult.success) return stringResult;

    const str = stringResult.value;

    if (min !== undefined && str.length < min) {
      return Err(
        `${field || 'String'} must be at least ${min} characters`,
        field,
      );
    }

    if (max !== undefined && str.length > max) {
      return Err(
        `${field || 'String'} must be at most ${max} characters`,
        field,
      );
    }

    return Ok(str);
  };

/**
 * Validate number range
 */
export const numberRange =
  (min?: number, max?: number, field?: string): Validator<number> =>
  (value) => {
    const numberResult = number(field)(value);
    if (!numberResult.success) return numberResult;

    const num = numberResult.value;

    if (min !== undefined && num < min) {
      return Err(`${field || 'Number'} must be at least ${min}`, field);
    }

    if (max !== undefined && num > max) {
      return Err(`${field || 'Number'} must be at most ${max}`, field);
    }

    return Ok(num);
  };

/**
 * Validate enum value
 */
export const enumValue =
  <T extends string>(values: readonly T[], field?: string): Validator<T> =>
  (value) => {
    const stringResult = string(field)(value);
    if (!stringResult.success) return stringResult;

    if (!values.includes(stringResult.value as T)) {
      return Err(
        `${field || 'Value'} must be one of: ${values.join(', ')}`,
        field,
      );
    }

    return Ok(stringResult.value as T);
  };

/**
 * Make a validator optional
 */
export const optional =
  <T>(validator: Validator<T>): Validator<T | undefined> =>
  (value) => {
    if (value === undefined || value === null) {
      return Ok(undefined);
    }

    return validator(value);
  };

/**
 * Provide default value if validation fails
 */
export const withDefault =
  <T>(validator: Validator<T>, defaultValue: T): Validator<T> =>
  (value) => {
    if (value === undefined || value === null) {
      return Ok(defaultValue);
    }

    const result = validator(value);
    if (!result.success) {
      return Ok(defaultValue);
    }

    return result;
  };
