import { ok, err, createCoreError } from '@trailhead/core';
import type { Result, CoreError } from '@trailhead/core';
import {
  createValidationError,
  createSchemaValidationError,
  type ValidationError,
} from '../validation/index.js';
import { validate } from '../core/zod-schema.js';
import type { ConfigValidator, ZodConfigSchema } from '../core/zod-schema.js';

// ========================================
// Enhanced Validator Operations
// ========================================

export interface ValidatorOperations {
  readonly register: <T>(validator: ConfigValidator<T>) => void;
  readonly unregister: (name: string) => void;
  readonly validate: <T>(
    config: T,
    validators: readonly ConfigValidator<T>[]
  ) => Result<void, CoreError>;
  readonly validateSchema: <T>(config: T, schema: ZodConfigSchema<T>) => Result<void, CoreError>;
  readonly getRegisteredValidators: () => readonly string[];
  readonly hasValidator: (name: string) => boolean;
}

export const createValidatorOperations = (): ValidatorOperations => {
  const validators = new Map<string, ConfigValidator<any>>();

  const register = <T>(validator: ConfigValidator<T>): void => {
    validators.set(validator.name, validator);
  };

  const unregister = (name: string): void => {
    validators.delete(name);
  };

  const validate = <T>(
    config: T,
    configValidators: readonly ConfigValidator<T>[]
  ): Result<void, CoreError> => {
    try {
      const errors: ValidationError[] = [];

      // Run all validators and collect errors
      for (const validator of configValidators) {
        const result = validator.validate(config);
        if (result.isErr()) {
          // Extract validation errors from the result
          if (result.error.code === 'VALIDATION_ERROR') {
            errors.push(result.error as any as ValidationError);
          } else if (
            result.error.code === 'SCHEMA_VALIDATION_FAILED' &&
            result.error.context?.errors
          ) {
            const nestedErrors = result.error.context.errors.filter(
              (e: any) => e.type === 'VALIDATION_ERROR'
            );
            errors.push(...nestedErrors);
          } else {
            // Convert other errors to validation errors
            errors.push(
              createValidationError({
                field: 'configuration',
                value: config,
                expectedType: 'valid',
                suggestion: result.error.message || 'Fix validation error',
                rule: validator.name,
                cause: result.error,
              })
            );
          }
        }
      }

      if (errors.length > 0) {
        return err(createSchemaValidationError(errors, 'ConfigValidators'));
      }

      return ok(undefined);
    } catch (error) {
      return err(
        createCoreError('VALIDATION_FAILED', 'Configuration validation failed', {
          component: '@trailhead/config',
          operation: 'validate-config',
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  };

  const validateSchema = <T>(config: T, schema: ZodConfigSchema<T>): Result<void, CoreError> => {
    // Use the enhanced schema validation from core/schema.ts
    return validate(config, schema).map(() => undefined);
  };

  const getRegisteredValidators = (): readonly string[] => {
    return Array.from(validators.keys());
  };

  const hasValidator = (name: string): boolean => {
    return validators.has(name);
  };

  return {
    register,
    unregister,
    validate,
    validateSchema,
    getRegisteredValidators,
    hasValidator,
  };
};

// ========================================
// Built-in Validators
// ========================================

export const createEnvironmentValidator = (): ConfigValidator<any> => ({
  name: 'environment',
  priority: 1,
  validate: (config: any) => {
    if (config.environment && typeof config.environment === 'string') {
      const validEnvironments = ['development', 'staging', 'production', 'test'];

      if (!validEnvironments.includes(config.environment)) {
        return err(
          createValidationError({
            field: 'environment',
            value: config.environment,
            expectedType: 'string',
            suggestion: 'Environment must be one of: development, staging, production, test',
            examples: validEnvironments,
            rule: 'environment',
          })
        );
      }
    }

    return ok(undefined);
  },
});

export const createPortValidator = (): ConfigValidator<any> => ({
  name: 'port',
  priority: 2,
  validate: (config: any) => {
    if (config.port !== undefined) {
      if (typeof config.port !== 'number') {
        return err(
          createValidationError({
            field: 'port',
            value: config.port,
            expectedType: 'number',
            suggestion: 'Port must be a number',
            examples: [3000, 8080, 9000],
            rule: 'port-type',
          })
        );
      }

      if (config.port < 1 || config.port > 65535) {
        return err(
          createValidationError({
            field: 'port',
            value: config.port,
            expectedType: 'number',
            suggestion: 'Port must be between 1 and 65535',
            examples: [3000, 8080, 9000],
            rule: 'port-range',
            constraints: { min: 1, max: 65535 },
          })
        );
      }
    }

    return ok(undefined);
  },
});

export const createUrlValidator = (): ConfigValidator<any> => ({
  name: 'url',
  priority: 3,
  validate: (config: any) => {
    const urlFields = ['url', 'baseUrl', 'apiUrl', 'databaseUrl'];

    for (const field of urlFields) {
      if (config[field] !== undefined) {
        if (typeof config[field] !== 'string') {
          return err(
            createValidationError({
              field,
              value: config[field],
              expectedType: 'string',
              suggestion: `${field} must be a valid URL string`,
              examples: ['https://example.com', 'http://localhost:3000'],
              rule: 'url-type',
            })
          );
        }

        try {
          void new URL(config[field]);
        } catch {
          return err(
            createValidationError({
              field,
              value: config[field],
              expectedType: 'string',
              suggestion: `${field} must be a valid URL`,
              examples: [
                'https://example.com',
                'http://localhost:3000',
                'postgres://user:pass@host:5432/db',
              ],
              rule: 'url-format',
            })
          );
        }
      }
    }

    return ok(undefined);
  },
});

export const createSecurityValidator = (): ConfigValidator<any> => ({
  name: 'security',
  priority: 10,
  validate: (config: any) => {
    const errors: ValidationError[] = [];

    // Check for potential security issues
    if (config.debug === true && config.environment === 'production') {
      errors.push(
        createValidationError({
          field: 'debug',
          value: config.debug,
          expectedType: 'boolean',
          suggestion: 'Debug mode should be disabled in production',
          examples: [false],
          rule: 'security-debug',
        })
      );
    }

    // Check for exposed secrets in config
    const secretFields = ['password', 'secret', 'key', 'token', 'apiKey'];
    for (const field of secretFields) {
      if (config[field] && typeof config[field] === 'string') {
        // Very basic check - in practice would be more sophisticated
        if (config[field].length < 8) {
          errors.push(
            createValidationError({
              field,
              value: '[REDACTED]',
              expectedType: 'string',
              suggestion: `${field} should be at least 8 characters long for security`,
              rule: 'security-length',
              constraints: { minLength: 8 },
            })
          );
        }
      }
    }

    if (errors.length > 0) {
      return err(createSchemaValidationError(errors, 'SecurityValidation'));
    }

    return ok(undefined);
  },
});
