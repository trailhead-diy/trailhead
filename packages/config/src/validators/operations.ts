import { ok, err, type Result, type CoreError } from '@esteban-url/core'
import { z } from '@esteban-url/validation'
import {
  createValidationError,
  createSchemaValidationError,
  type ValidationError,
} from '../validation/index.js'
import {
  validate as validateWithZodSchema,
  type ConfigValidator,
  type ZodConfigSchema,
} from '../core/zod-schema.js'

// ========================================
// Enhanced Validator Operations
// ========================================

/**
 * Validator operations interface for managing configuration validators.
 *
 * Provides registration and management of custom validators that perform
 * business logic validation beyond basic schema validation, such as
 * environment-specific rules, connectivity checks, and custom constraints.
 */
export interface ValidatorOperations {
  readonly register: <T>(validator: import('../types.js').ConfigValidator<T>) => void
  readonly unregister: (name: string) => void
  readonly validate: <T>(
    config: T,
    validators: readonly import('../types.js').ConfigValidator<T>[]
  ) => Promise<Result<void, CoreError>>
  readonly validateSchema: <T>(config: T, schema: unknown) => Result<void, CoreError>
  readonly getRegisteredValidators: () => readonly string[]
  readonly hasValidator: (name: string) => boolean
}

/**
 * Creates validator operations for managing configuration validators.
 *
 * Provides a registry system for custom validators that can perform complex
 * business logic validation beyond what schema validation provides. Useful for
 * environment-specific validation, connectivity checks, and custom constraints.
 *
 * @returns Validator operations interface with registration and validation capabilities
 *
 * @example
 * ```typescript
 * const validatorOps = createValidatorOperations()
 *
 * // Register a custom validator
 * const dbConnectivityValidator: ConfigValidator<DatabaseConfig> = {
 *   name: 'database-connectivity',
 *   validate: async (config) => {
 *     try {
 *       await testDatabaseConnection(config.host, config.port)
 *       return ok(config)
 *     } catch (error) {
 *       return err(createValidationError({
 *         field: 'database',
 *         value: config,
 *         expectedType: 'valid database configuration',
 *         suggestion: 'Check database host and port are accessible'
 *       }))
 *     }
 *   }
 * }
 *
 * validatorOps.register(dbConnectivityValidator)
 *
 * // Validate configuration
 * const result = await validatorOps.validate(config, [dbConnectivityValidator])
 * ```
 *
 * @see {@link ValidatorOperations} - Operations interface definition
 * @see {@link ConfigValidator} - Validator interface for custom implementations
 */
export const createValidatorOperations = (): ValidatorOperations => {
  const validators = new Map<string, import('../types.js').ConfigValidator<any>>()

  const register = <T>(validator: import('../types.js').ConfigValidator<T>): void => {
    validators.set(validator.name, validator)
  }

  const unregister = (name: string): void => {
    validators.delete(name)
  }

  const validate = async <T>(
    config: T,
    configValidators: readonly import('../types.js').ConfigValidator<T>[]
  ): Promise<Result<void, CoreError>> => {
    const errors: CoreError[] = []

    for (const validator of configValidators) {
      try {
        const result = await validator.validate(config)
        if (result.isErr()) {
          errors.push(result.error)
        }
      } catch {
        errors.push(
          createValidationError({
            field: 'unknown',
            value: undefined,
            expectedType: 'unknown',
            suggestion: `Validator "${validator.name}" failed unexpectedly`,
            examples: [],
            rule: 'validator-error',
          })
        )
      }
    }

    if (errors.length > 0) {
      return err(createSchemaValidationError(errors as any, 'validators'))
    }

    return ok(undefined)
  }

  const validateSchema = <T>(config: T, schema: unknown): Result<void, CoreError> => {
    // Check if schema is a ZodConfigSchema and validate accordingly
    if (schema && typeof schema === 'object' && 'zodSchema' in schema) {
      const validationResult = validateWithZodSchema(config, schema as ZodConfigSchema<T>)
      return validationResult.map(() => undefined)
    }
    // For now, return ok for other schema types
    return ok(undefined)
  }

  const getRegisteredValidators = (): readonly string[] => {
    return Array.from(validators.keys())
  }

  const hasValidator = (name: string): boolean => {
    return validators.has(name)
  }

  return {
    register,
    unregister,
    validate,
    validateSchema,
    getRegisteredValidators,
    hasValidator,
  }
}

// ========================================
// Built-in Validators
// ========================================

/**
 * Creates a built-in validator for environment field validation.
 *
 * Validates that the application environment is set to one of the standard
 * values: development, staging, production, or test.
 *
 * @returns Environment validator instance
 *
 * @example
 * ```typescript
 * const envValidator = createEnvironmentValidator()
 * const validatorOps = createValidatorOperations()
 * validatorOps.register(envValidator)
 * ```
 */
export const createEnvironmentValidator = (): ConfigValidator<any> => ({
  name: 'environment',
  schema: {
    name: 'environment-validator',
    zodSchema: z.any(), // Simple schema for now
  },
  validate: async (config: any) => {
    // Check app.environment (nested structure)
    const environment = config.app?.environment
    if (environment && typeof environment === 'string') {
      const validEnvironments = ['development', 'staging', 'production', 'test']

      if (!validEnvironments.includes(environment)) {
        return err(
          createValidationError({
            field: 'app.environment',
            value: environment,
            expectedType: 'string',
            suggestion: 'Environment must be one of: development, staging, production, test',
            examples: validEnvironments,
            rule: 'environment',
          })
        )
      }
    }

    return ok(config)
  },
})

/**
 * Creates a built-in validator for port number validation.
 *
 * Validates that server port numbers are within the valid range (1-65535)
 * and are properly configured for the application environment.
 *
 * @returns Port validator instance
 *
 * @example
 * ```typescript
 * const portValidator = createPortValidator()
 * const validatorOps = createValidatorOperations()
 * validatorOps.register(portValidator)
 * ```
 */
export const createPortValidator = (): ConfigValidator<any> => ({
  name: 'port',
  schema: {
    name: 'port-validator',
    zodSchema: z.any(),
  },
  validate: async (config: any) => {
    // Check server.port (nested structure)
    const port = config.server?.port
    if (port !== undefined) {
      if (typeof port !== 'number') {
        return err(
          createValidationError({
            field: 'server.port',
            value: port,
            expectedType: 'number',
            suggestion: 'Port must be a number',
            examples: [3000, 8080, 9000],
            rule: 'port-type',
          })
        )
      }

      if (port < 1 || port > 65535) {
        return err(
          createValidationError({
            field: 'server.port',
            value: port,
            expectedType: 'number',
            suggestion: 'Port must be between 1 and 65535',
            examples: [3000, 8080, 9000],
            rule: 'port-range',
            constraints: { min: 1, max: 65535 },
          })
        )
      }
    }

    return ok(config)
  },
})

export const createUrlValidator = (): ConfigValidator<any> => ({
  name: 'url',
  schema: {
    name: 'url-validator',
    zodSchema: z.any(),
  },
  validate: async (config: any) => {
    // Check nested URL fields in the config structure
    const urlChecks = [
      { path: config.server?.baseUrl, field: 'server.baseUrl' },
      { path: config.database?.url, field: 'database.url' },
    ]

    for (const { path: urlValue, field } of urlChecks) {
      if (urlValue !== undefined) {
        if (typeof urlValue !== 'string') {
          return err(
            createValidationError({
              field,
              value: urlValue,
              expectedType: 'string',
              suggestion: `${field} must be a valid URL string`,
              examples: ['https://example.com', 'http://localhost:3000'],
              rule: 'url-type',
            })
          )
        }

        try {
          void new URL(urlValue)
        } catch {
          return err(
            createValidationError({
              field,
              value: urlValue,
              expectedType: 'string',
              suggestion: `${field} must be a valid URL`,
              examples: [
                'https://example.com',
                'http://localhost:3000',
                'postgres://user:pass@host:5432/db',
              ],
              rule: 'url-format',
            })
          )
        }
      }
    }

    return ok(config)
  },
})

export const createSecurityValidator = (): ConfigValidator<any> => ({
  name: 'security',
  schema: {
    name: 'security-validator',
    zodSchema: z.any(),
  },
  validate: async (config: any) => {
    const errors: ValidationError[] = []

    // Check for potential security issues (nested structure)
    const debug = config.app?.debug
    const environment = config.app?.environment
    if (debug === true && environment === 'production') {
      errors.push(
        createValidationError({
          field: 'app.debug',
          value: debug,
          expectedType: 'boolean',
          suggestion: 'Debug mode should be disabled in production',
          examples: [false],
          rule: 'security-debug',
        })
      )
    }

    // Check for exposed secrets in nested security config
    const securityConfig = config.security
    if (securityConfig && typeof securityConfig === 'object') {
      const secretFields = ['apiKey', 'jwtSecret']
      for (const field of secretFields) {
        const value = securityConfig[field]
        if (value && typeof value === 'string') {
          // Very basic check - in practice would be more sophisticated
          if (value.length < 8) {
            errors.push(
              createValidationError({
                field: `security.${field}`,
                value: '[REDACTED]',
                expectedType: 'string',
                suggestion: `${field} should be at least 8 characters long for security`,
                rule: 'security-length',
                constraints: { minLength: 8 },
              })
            )
          }
        }
      }
    }

    if (errors.length > 0) {
      return err(createSchemaValidationError(errors, 'SecurityValidation'))
    }

    return ok(config)
  },
})
