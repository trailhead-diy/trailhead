import { ok, err } from '@trailhead/core';
import type { ValidatorOperations, ConfigValidator, ConfigResult, ConfigSchema } from '../types.js';

// ========================================
// Validator Operations
// ========================================

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
  ): ConfigResult<void> => {
    try {
      for (const validator of configValidators) {
        const result = validator.validate(config);
        if (result.isErr()) {
          return result;
        }
      }

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'ConfigValidationError',
        code: 'VALIDATION_FAILED',
        message: 'Configuration validation failed',
        suggestion: 'Check configuration values against the schema',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const validateSchema = <T>(config: T, schema: ConfigSchema<T>): ConfigResult<void> => {
    try {
      // Basic schema validation
      if (schema.required) {
        for (const requiredField of schema.required) {
          if (!(requiredField in (config as any))) {
            return err({
              type: 'ConfigValidationError',
              code: 'MISSING_REQUIRED_FIELD',
              message: `Required field '${requiredField}' is missing`,
              suggestion: `Provide a value for '${requiredField}'`,
              recoverable: true,
            } as any);
          }
        }
      }

      // Custom validation
      if (schema.validate) {
        return schema.validate(config);
      }

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'ConfigValidationError',
        code: 'SCHEMA_VALIDATION_FAILED',
        message: 'Schema validation failed',
        suggestion: 'Check configuration against the schema',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  return {
    register,
    unregister,
    validate,
    validateSchema,
  };
};
