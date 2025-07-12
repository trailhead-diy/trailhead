import type { Result } from 'neverthrow';
import { ok, err } from 'neverthrow';
import type { ConfigurationError } from '../errors/types.js';
import { createConfigurationError } from '../errors/factory.js';

/**
 * Configuration builder pattern for composable configuration
 */
export interface ConfigBuilder<T> {
  readonly build: () => Result<T, ConfigurationError>;
  readonly with: <K extends keyof T>(key: K, value: T[K]) => ConfigBuilder<T>;
  readonly merge: (other: Partial<T>) => ConfigBuilder<T>;
  readonly validate: (
    validator: (config: Partial<T>) => Result<void, ConfigurationError>
  ) => ConfigBuilder<T>;
}

/**
 * Create a configuration builder
 */
export const createConfig = <T>(defaults: T): ConfigBuilder<T> => {
  const config: Partial<T> = { ...defaults };
  const validators: Array<(config: Partial<T>) => Result<void, ConfigurationError>> = [];

  const builder: ConfigBuilder<T> = {
    build: (): Result<T, ConfigurationError> => {
      // Run all validators
      for (const validator of validators) {
        const validationResult = validator(config);
        if (validationResult.isErr()) {
          return err(validationResult.error);
        }
      }

      // Check if all required fields are present
      const missingFields: string[] = [];
      for (const [key, value] of Object.entries(defaults as Record<string, unknown>)) {
        if (value !== undefined && config[key as keyof T] === undefined) {
          missingFields.push(key);
        }
      }

      if (missingFields.length > 0) {
        return err(
          createConfigurationError(`Missing required configuration fields`, {
            missingFields,
            suggestion: `Provide values for: ${missingFields.join(', ')}`,
          })
        );
      }

      return ok(config as T);
    },

    with: <K extends keyof T>(key: K, value: T[K]): ConfigBuilder<T> => {
      const newConfig = { ...config };
      newConfig[key] = value;
      return createConfig(newConfig as T);
    },

    merge: (other: Partial<T>): ConfigBuilder<T> => {
      const newConfig = { ...config, ...other };
      return createConfig(newConfig as T);
    },

    validate: (
      validator: (config: Partial<T>) => Result<void, ConfigurationError>
    ): ConfigBuilder<T> => {
      validators.push(validator);
      return builder;
    },
  };

  return builder;
};

/**
 * Common configuration validators
 */
export const validators = {
  /**
   * Validate that a field is required
   */
  required:
    <T>(field: keyof T) =>
    (config: Partial<T>): Result<void, ConfigurationError> => {
      if (config[field] === undefined || config[field] === null) {
        return err(
          createConfigurationError(`Required field '${String(field)}' is missing`, {
            missingFields: [String(field)],
            suggestion: `Provide a value for '${String(field)}'`,
          })
        );
      }
      return ok(undefined);
    },

  /**
   * Validate that a field is a string
   */
  isString:
    <T>(field: keyof T) =>
    (config: Partial<T>): Result<void, ConfigurationError> => {
      const value = config[field];
      if (value !== undefined && typeof value !== 'string') {
        return err(
          createConfigurationError(`Field '${String(field)}' must be a string`, {
            invalidFields: [String(field)],
            suggestion: `Ensure '${String(field)}' is a string value`,
          })
        );
      }
      return ok(undefined);
    },

  /**
   * Validate that a field is a number
   */
  isNumber:
    <T>(field: keyof T) =>
    (config: Partial<T>): Result<void, ConfigurationError> => {
      const value = config[field];
      if (value !== undefined && typeof value !== 'number') {
        return err(
          createConfigurationError(`Field '${String(field)}' must be a number`, {
            invalidFields: [String(field)],
            suggestion: `Ensure '${String(field)}' is a numeric value`,
          })
        );
      }
      return ok(undefined);
    },

  /**
   * Validate that a field is a boolean
   */
  isBoolean:
    <T>(field: keyof T) =>
    (config: Partial<T>): Result<void, ConfigurationError> => {
      const value = config[field];
      if (value !== undefined && typeof value !== 'boolean') {
        return err(
          createConfigurationError(`Field '${String(field)}' must be a boolean`, {
            invalidFields: [String(field)],
            suggestion: `Ensure '${String(field)}' is true or false`,
          })
        );
      }
      return ok(undefined);
    },

  /**
   * Validate that a field is within a range
   */
  inRange:
    <T>(field: keyof T, min: number, max: number) =>
    (config: Partial<T>): Result<void, ConfigurationError> => {
      const value = config[field];
      if (typeof value === 'number' && (value < min || value > max)) {
        return err(
          createConfigurationError(`Field '${String(field)}' must be between ${min} and ${max}`, {
            invalidFields: [String(field)],
            suggestion: `Set '${String(field)}' to a value between ${min} and ${max}`,
          })
        );
      }
      return ok(undefined);
    },

  /**
   * Validate that a field is one of the allowed values
   */
  oneOf:
    <T, V>(field: keyof T, allowedValues: readonly V[]) =>
    (config: Partial<T>): Result<void, ConfigurationError> => {
      const value = config[field];
      if (value !== undefined && !allowedValues.includes(value as unknown as V)) {
        return err(
          createConfigurationError(
            `Field '${String(field)}' must be one of: ${allowedValues.join(', ')}`,
            {
              invalidFields: [String(field)],
              suggestion: `Set '${String(field)}' to one of: ${allowedValues.join(', ')}`,
            }
          )
        );
      }
      return ok(undefined);
    },

  /**
   * Validate that a string field matches a pattern
   */
  matchesPattern:
    <T>(field: keyof T, pattern: RegExp, description: string) =>
    (config: Partial<T>): Result<void, ConfigurationError> => {
      const value = config[field];
      if (typeof value === 'string' && !pattern.test(value)) {
        return err(
          createConfigurationError(`Field '${String(field)}' does not match required pattern`, {
            invalidFields: [String(field)],
            suggestion: `Ensure '${String(field)}' ${description}`,
          })
        );
      }
      return ok(undefined);
    },
};

/**
 * Configuration composition utilities
 */
export const configOps = {
  /**
   * Merge multiple configurations
   */
  merge: <T>(...configs: Partial<T>[]): Partial<T> => {
    return configs.reduce((acc, config) => ({ ...acc, ...config }), {});
  },

  /**
   * Pick specific fields from configuration
   */
  pick: <T extends Record<string, any>, K extends keyof T>(config: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in config) {
        result[key] = config[key];
      }
    }
    return result;
  },

  /**
   * Omit specific fields from configuration
   */
  omit: <T, K extends keyof T>(config: T, keys: K[]): Omit<T, K> => {
    const result = { ...config };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },

  /**
   * Transform configuration values
   */
  map: <T extends Record<string, any>, U>(
    config: T,
    mapper: (value: T[keyof T], key: keyof T) => U
  ): Record<keyof T, U> => {
    const result = {} as Record<keyof T, U>;
    for (const [key, value] of Object.entries(config) as Array<[keyof T, T[keyof T]]>) {
      result[key] = mapper(value, key);
    }
    return result;
  },

  /**
   * Filter configuration by predicate
   */
  filter: <T extends Record<string, any>>(
    config: T,
    predicate: (value: T[keyof T], key: keyof T) => boolean
  ): Partial<T> => {
    const result = {} as Partial<T>;
    for (const [key, value] of Object.entries(config) as Array<[keyof T, T[keyof T]]>) {
      if (predicate(value, key)) {
        result[key] = value;
      }
    }
    return result;
  },
};

/**
 * Environment variable helpers
 */
export const env = {
  /**
   * Get environment variable with default
   */
  get: (key: string, defaultValue?: string): string | undefined => {
    return process.env[key] ?? defaultValue;
  },

  /**
   * Get required environment variable
   */
  require: (key: string): Result<string, ConfigurationError> => {
    const value = process.env[key];
    if (!value) {
      return err(
        createConfigurationError(`Required environment variable '${key}' is not set`, {
          missingFields: [key],
          suggestion: `Set the ${key} environment variable`,
        })
      );
    }
    return ok(value);
  },

  /**
   * Parse environment variable as number
   */
  getNumber: (key: string, defaultValue?: number): Result<number, ConfigurationError> => {
    const value = process.env[key];
    if (!value) {
      return defaultValue !== undefined
        ? ok(defaultValue)
        : err(
            createConfigurationError(`Environment variable '${key}' is not set`, {
              missingFields: [key],
            })
          );
    }

    const parsed = Number(value);
    if (isNaN(parsed)) {
      return err(
        createConfigurationError(`Environment variable '${key}' is not a valid number`, {
          invalidFields: [key],
          suggestion: `Set ${key} to a numeric value`,
        })
      );
    }

    return ok(parsed);
  },

  /**
   * Parse environment variable as boolean
   */
  getBoolean: (key: string, defaultValue?: boolean): Result<boolean, ConfigurationError> => {
    const value = process.env[key];
    if (!value) {
      return defaultValue !== undefined
        ? ok(defaultValue)
        : err(
            createConfigurationError(`Environment variable '${key}' is not set`, {
              missingFields: [key],
            })
          );
    }

    const lowercaseValue = value.toLowerCase();
    if (lowercaseValue === 'true' || lowercaseValue === '1') {
      return ok(true);
    }
    if (lowercaseValue === 'false' || lowercaseValue === '0') {
      return ok(false);
    }

    return err(
      createConfigurationError(`Environment variable '${key}' is not a valid boolean`, {
        invalidFields: [key],
        suggestion: `Set ${key} to 'true', 'false', '1', or '0'`,
      })
    );
  },
};
