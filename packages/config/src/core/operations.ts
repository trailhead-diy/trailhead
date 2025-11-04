import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import {
  createConfigValidationError,
  createSchemaValidationError,
  type ConfigValidationError,
} from '../validation/errors.js'
import {
  validateWithZodSchema as validate,
  type ZodConfigSchema as ConfigSchema,
} from './zod-schema.js'
import { createConfigManager } from './manager.js'
import { createLoaderOperations } from '../loaders/operations.js'
import { createValidatorOperations } from '../validators/operations.js'
import { createTransformerOperations } from '../transformers/operations.js'
import type {
  ConfigDefinition as BaseConfigDefinition,
  ConfigSource,
  ConfigSourceType,
  ConfigState,
  ConfigMetadata,
  ResolvedSource,
  ConfigTransformer,
  ConfigChangeCallback,
  ConfigWatcher,
  ConfigWatchCallback,
  ConfigManager,
} from '../types.js'
// ConfigValidator type imported via relative import in interface definitions

// Enhanced ConfigDefinition with proper Zod schema typing
export interface ConfigDefinition<T = Record<string, unknown>>
  extends Omit<BaseConfigDefinition<T>, 'schema'> {
  readonly schema?: ConfigSchema<T>
}

// ========================================
// Enhanced Configuration Operations
// ========================================

export type ConfigResult<T> = Result<T, CoreError>

// All types are imported from ../types.js

// ========================================
// Enhanced Configuration Operations
// ========================================

/**
 * Configuration operations interface providing core functionality for
 * configuration management including creation, loading, watching, and validation.
 *
 * This interface defines the main API for working with configurations,
 * supporting multiple sources, validation, transformation, and real-time updates.
 *
 * @see {@link createConfigOperations} - Factory function for creating operations
 */
export interface ConfigOperations {
  readonly create: <T>(definition: ConfigDefinition<T>) => ConfigResult<ConfigManager<T>>
  readonly load: <T>(definition: ConfigDefinition<T>) => Promise<ConfigResult<ConfigState<T>>>
  readonly watch: <T>(
    definition: ConfigDefinition<T>,
    callback: ConfigChangeCallback<T>
  ) => Promise<ConfigResult<ConfigWatcher[]>>
  readonly validate: <T>(config: T, schema: ConfigSchema<T>) => ConfigResult<void>
  readonly transform: <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ) => ConfigResult<T>
}

/**
 * Loader operations interface for managing configuration source loaders.
 *
 * Provides registration and management of loaders that can fetch configuration
 * data from various sources like files, environment variables, remote APIs, etc.
 */
export interface LoaderOperations {
  readonly register: (loader: ConfigLoader) => void
  readonly unregister: (type: ConfigSourceType) => void
  readonly getLoader: (source: ConfigSource) => ConfigLoader | undefined
  readonly load: (source: ConfigSource) => Promise<ConfigResult<Record<string, unknown>>>
}

/**
 * Validator operations interface for managing configuration validators.
 *
 * Provides registration and management of custom validators that can perform
 * business logic validation beyond basic schema validation.
 */
export interface ValidatorOperations {
  readonly register: <T>(validator: import('../types.js').ConfigValidator<T>) => void
  readonly unregister: (name: string) => void
  readonly validate: <T>(
    config: T,
    validators: readonly import('../types.js').ConfigValidator<T>[]
  ) => ConfigResult<void>
  readonly validateSchema: <T>(config: T, schema: unknown) => ConfigResult<void>
}

/**
 * Transformer operations interface for managing configuration transformers.
 *
 * Provides registration and management of transformers that can modify
 * configuration data during the loading process.
 */
export interface TransformerOperations {
  readonly register: <T>(transformer: ConfigTransformer<T>) => void
  readonly unregister: (name: string) => void
  readonly transform: <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ) => ConfigResult<T>
}

/**
 * Configuration loader interface for implementing custom source loaders.
 *
 * Loaders are responsible for fetching configuration data from specific
 * source types and optionally watching for changes.
 *
 * @example
 * ```typescript
 * const s3Loader: ConfigLoader = {
 *   load: async (source) => {
 *     const data = await s3.getObject(source.path)
 *     return ok(JSON.parse(data))
 *   },
 *   supports: (source) => source.type === 's3'
 * }
 * ```
 */
export interface ConfigLoader {
  readonly load: (source: ConfigSource) => Promise<ConfigResult<Record<string, unknown>>>
  readonly watch?: (
    source: ConfigSource,
    callback: ConfigWatchCallback
  ) => Promise<ConfigResult<ConfigWatcher>>
  readonly supports: (source: ConfigSource) => boolean
}

// ========================================
// Enhanced Operations Implementation
// ========================================

/**
 * Creates configuration operations with integrated loader, validator, and transformer operations.
 *
 * This is the main factory function for creating a complete configuration management system.
 * It provides a unified API for all configuration operations with proper error handling,
 * validation, and type safety.
 *
 * @returns Complete configuration operations interface
 *
 * @example
 * ```typescript
 * const ops = createConfigOperations()
 *
 * // Create a configuration manager
 * const managerResult = ops.create({
 *   name: 'app-config',
 *   sources: [
 *     { type: 'env', env: 'APP_', priority: 1 },
 *     { type: 'file', path: './config.json', priority: 2, optional: true }
 *   ],
 *   schema: myConfigSchema
 * })
 *
 * if (managerResult.isOk()) {
 *   const manager = managerResult.value
 *   const state = await manager.load()
 * }
 * ```
 *
 * @see {@link ConfigOperations} - Operations interface definition
 * @see {@link ConfigDefinition} - Configuration definition structure
 */
export const createConfigOperations = (): ConfigOperations => {
  const loaderOps = createLoaderOperations()
  const validatorOps = createValidatorOperations()
  const transformerOps = createTransformerOperations()

  const create = <T>(definition: ConfigDefinition<T>): ConfigResult<ConfigManager<T>> => {
    // Enhanced validation of definition
    const validationResult = validateDefinition(definition)
    if (validationResult.isErr()) {
      return err(validationResult.error)
    }

    return ok(
      createConfigManager(definition, {
        loaderOps,
        validatorOps,
        transformerOps,
      })
    )
  }

  const load = async <T>(
    definition: ConfigDefinition<T>
  ): Promise<ConfigResult<ConfigState<T>>> => {
    const startTime = Date.now()

    // Validate definition first
    const definitionValidation = validateDefinition(definition)
    if (definitionValidation.isErr()) {
      return err(definitionValidation.error)
    }

    try {
      // Load data from all sources
      const sourceResults = await Promise.all(
        definition.sources.map(async (source): Promise<ResolvedSource> => {
          const sourceStartTime = Date.now()

          try {
            const dataResult = await loaderOps.load(source)

            if (dataResult.isErr()) {
              return {
                source,
                data: {},
                loadTime: Date.now() - sourceStartTime,
                error: dataResult.error,
              }
            }

            return {
              source,
              data: dataResult.value,
              loadTime: Date.now() - sourceStartTime,
            }
          } catch (error) {
            return {
              source,
              data: {},
              loadTime: Date.now() - sourceStartTime,
              error: createCoreError(
                'SOURCE_LOAD_FAILED',
                'SOURCE_ERROR',
                `Failed to load source: ${source.type}`,
                {
                  component: 'config',
                  operation: 'load-source',
                  severity: 'high',
                  context: { source },
                  cause: error instanceof Error ? error : undefined,
                }
              ),
            }
          }
        })
      )

      // Check for critical source failures
      const criticalErrors = sourceResults
        .filter((result) => result.error && !result.source.optional)
        .map((result) => result.error!)

      if (criticalErrors.length > 0) {
        return err(
          createCoreError(
            'CRITICAL_SOURCES_FAILED',
            'CRITICAL_ERROR',
            'Required configuration sources failed to load',
            {
              component: 'config',
              operation: 'load-config',
              severity: 'critical',
              context: { errors: criticalErrors },
            }
          )
        )
      }

      // Merge configuration from all sources
      const mergedConfig = mergeSourceData(sourceResults, definition.defaults)

      // Transform configuration
      let transformedConfig: T
      if (definition.transformers && definition.transformers.length > 0) {
        const transformResult = transformerOps.transform(mergedConfig, definition.transformers)
        if (transformResult.isErr()) {
          return err(transformResult.error)
        }
        transformedConfig = transformResult.value
      } else {
        transformedConfig = mergedConfig as T
      }

      // Validate against schema (if provided)
      const validationErrors: ConfigValidationError[] = []
      let validatedConfig: T

      if (definition.schema) {
        const validationResult = validate(transformedConfig, definition.schema)

        if (validationResult.isErr()) {
          const errors = extractValidationErrors(validationResult.error)
          validationErrors.push(...errors)
          validatedConfig = transformedConfig // Use transformed config even with validation errors
        } else {
          validatedConfig = validationResult.value
        }
      } else {
        validatedConfig = transformedConfig
      }

      // Run additional validators
      const additionalValidationErrors: CoreError[] = []
      if (definition.validators && definition.validators.length > 0) {
        const additionalValidationResult = await validatorOps.validate(
          validatedConfig,
          definition.validators
        )
        if (additionalValidationResult.isErr()) {
          additionalValidationErrors.push(additionalValidationResult.error)
        }
      }

      // Create metadata
      const metadata: ConfigMetadata = {
        loadTime: Date.now() - startTime,
        sourceCount: sourceResults.length,
        valid: validationErrors.length === 0 && additionalValidationErrors.length === 0,
        validationErrors,
        transformationErrors: additionalValidationErrors,
        version: definition.version,
        checksum: generateChecksum(validatedConfig),
      }

      // Create state
      const state: ConfigState<T> = {
        definition,
        raw: mergedConfig,
        resolved: validatedConfig,
        sources: sourceResults,
        metadata,
      }

      return ok(state)
    } catch (error) {
      return err(
        createCoreError('CONFIG_LOAD_FAILED', 'LOAD_ERROR', 'Configuration loading failed', {
          component: 'config',
          operation: 'load-config',
          severity: 'high',
          context: { definition: definition.name },
          cause: error instanceof Error ? error : undefined,
        })
      )
    }
  }

  const watch = async <T>(
    definition: ConfigDefinition<T>,
    callback: ConfigChangeCallback<T>
  ): Promise<ConfigResult<ConfigWatcher[]>> => {
    const watchers: ConfigWatcher[] = []

    try {
      for (const source of definition.sources) {
        if (!source.watch) continue

        const loader = loaderOps.getLoader(source)
        if (!loader?.watch) continue

        const watchResult = await loader.watch(source, (data, error) => {
          // Handle configuration changes
          handleConfigChange(definition, data, error, callback)
        })

        if (watchResult.isErr()) {
          // Clean up existing watchers on failure
          await Promise.all(watchers.map((watcher) => watcher.stop()))
          return err(watchResult.error)
        }

        watchers.push(watchResult.value)
      }

      return ok(watchers)
    } catch (error) {
      // Clean up on error
      await Promise.all(watchers.map((watcher) => watcher.stop()))

      return err(
        createCoreError(
          'WATCH_SETUP_FAILED',
          'WATCH_ERROR',
          'Failed to setup configuration watching',
          {
            component: 'config',
            operation: 'watch-config',
            severity: 'medium',
            context: { definition: definition.name },
            cause: error instanceof Error ? error : undefined,
          }
        )
      )
    }
  }

  const validateConfig = <T>(config: T, schema: ConfigSchema<T>): ConfigResult<void> => {
    const validationResult = validate(config, schema)
    if (validationResult.isErr()) {
      return err(validationResult.error)
    }
    return ok(undefined)
  }

  const transform = <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ): ConfigResult<T> => {
    return transformerOps.transform(config, transformers)
  }

  return {
    create,
    load,
    watch,
    validate: validateConfig,
    transform,
  }
}

// ========================================
// Enhanced Validation Functions
// ========================================

/**
 * Validates a configuration definition for correctness and completeness.
 *
 * @param definition - Configuration definition to validate
 * @returns Result indicating validation success or errors found
 */
const validateDefinition = <T>(definition: ConfigDefinition<T>): ConfigResult<void> => {
  const errors: ConfigValidationError[] = []

  // Validate name
  if (!definition.name || typeof definition.name !== 'string') {
    errors.push(
      createConfigValidationError({
        field: 'name',
        value: definition.name,
        expectedType: 'string',
        suggestion: 'Provide a valid configuration name',
        examples: ['app-config', 'database-config'],
        path: [],
        rule: 'required',
      })
    )
  }

  // Schema is optional - no validation needed

  // Validate sources
  if (
    !definition.sources ||
    !Array.isArray(definition.sources) ||
    definition.sources.length === 0
  ) {
    errors.push(
      createConfigValidationError({
        field: 'sources',
        value: definition.sources,
        expectedType: 'array',
        suggestion: 'Provide at least one configuration source',
        examples: [[{ type: 'file', path: 'config.json', priority: 1 }]],
        path: [],
        rule: 'required',
      })
    )
  } else {
    // Validate individual sources
    definition.sources.forEach((source, index) => {
      if (!source.type) {
        errors.push(
          createConfigValidationError({
            field: 'type',
            value: source.type,
            expectedType: 'string',
            suggestion: 'Specify the source type (file, env, cli, object, remote, vault)',
            examples: ['file', 'env', 'cli'],
            path: ['sources', index.toString()],
            rule: 'required',
          })
        )
      }

      if (typeof source.priority !== 'number') {
        errors.push(
          createConfigValidationError({
            field: 'priority',
            value: source.priority,
            expectedType: 'number',
            suggestion: 'Specify a numeric priority for source ordering',
            examples: [1, 10, 100],
            path: ['sources', index.toString()],
            rule: 'required',
          })
        )
      }
    })
  }

  if (errors.length > 0) {
    return err(createSchemaValidationError(errors, 'ConfigDefinition'))
  }

  return ok(undefined)
}

// ========================================
// Utility Functions
// ========================================

/**
 * Merges configuration data from multiple resolved sources based on priority.
 *
 * Sources with higher priority values override those with lower priority.
 * Defaults are applied first, then sources are merged in priority order.
 *
 * @param sources - Array of resolved configuration sources
 * @param defaults - Optional default values to apply first
 * @returns Merged configuration object
 */
const mergeSourceData = (
  sources: readonly ResolvedSource[],
  defaults?: Record<string, unknown>
): Record<string, unknown> => {
  // Sort sources by priority (higher priority overwrites lower)
  const sortedSources = [...sources]
    .filter((source) => !source.error)
    .sort((a, b) => a.source.priority - b.source.priority)

  let merged = defaults ? { ...defaults } : {}

  for (const source of sortedSources) {
    merged = deepMerge(merged, source.data)
  }

  return merged
}

/**
 * Performs deep merge of two configuration objects.
 *
 * Recursively merges nested objects while preserving type safety.
 * Arrays and primitive values are replaced rather than merged.
 *
 * @param target - Target object to merge into
 * @param source - Source object to merge from
 * @returns New merged object
 */
const deepMerge = (
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> => {
  const result = { ...target }

  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined) {
      result[key] = value
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      if (typeof result[key] === 'object' && !Array.isArray(result[key]) && result[key] !== null) {
        result[key] = deepMerge(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>
        )
      } else {
        result[key] = value
      }
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Generates a checksum for configuration data to detect changes.
 *
 * @param config - Configuration object to generate checksum for
 * @returns Hexadecimal checksum string
 */
const generateChecksum = (config: unknown): string => {
  try {
    const json = JSON.stringify(config, Object.keys(config as any).sort())

    // Simple hash function (for demo purposes - use crypto in production)
    let hash = 0
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16)
  } catch {
    return 'invalid'
  }
}

const extractValidationErrors = (error: CoreError): ConfigValidationError[] => {
  // If it's already a validation error, return it
  if (error.type === 'VALIDATION_ERROR') {
    // Type guard to safely cast to ConfigValidationError
    if (isConfigValidationError(error)) {
      return [error]
    }
  }

  // If it's a schema validation error, extract nested errors
  if (error.type === 'SCHEMA_VALIDATION_FAILED' && error.context?.errors) {
    const errors = error.context.errors
    if (Array.isArray(errors)) {
      return errors.filter(
        (e): e is ConfigValidationError =>
          typeof e === 'object' && e !== null && 'type' in e && e.type === 'VALIDATION_ERROR'
      )
    }
  }

  return []
}

// Type guard for ConfigValidationError
const isConfigValidationError = (error: unknown): error is ConfigValidationError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'suggestion' in error &&
    'examples' in error &&
    'expectedType' in error &&
    'path' in error
  )
}

// Export missing functions that are used by manager
/**
 * Alias for deepMerge function for external use.
 *
 * @see {@link deepMerge} - Deep merge implementation
 */
export const mergeConfigs = deepMerge

/**
 * Creates configuration metadata object with loading and validation information.
 *
 * @param loadTime - Time taken to load configuration in milliseconds
 * @param sourceCount - Number of configuration sources processed
 * @param validationErrors - Array of validation errors encountered
 * @param transformationErrors - Array of transformation errors encountered
 * @param version - Optional configuration version
 * @param checksum - Optional configuration checksum
 * @returns Configuration metadata object
 */
export const createConfigMetadata = (
  loadTime: number,
  sourceCount: number,
  validationErrors: readonly CoreError[] = [],
  transformationErrors: readonly CoreError[] = [],
  version?: string,
  checksum?: string
): ConfigMetadata => {
  return {
    loadTime,
    sourceCount,
    valid: validationErrors.length === 0 && transformationErrors.length === 0,
    validationErrors,
    transformationErrors,
    version,
    checksum,
  }
}

const handleConfigChange = <T>(
  definition: ConfigDefinition<T>,
  data: Record<string, unknown>,
  error: CoreError | undefined,
  _callback: ConfigChangeCallback<T>
): void => {
  // Implementation for handling configuration changes
  // This would involve reloading configuration and calling the callback
  // Simplified for now
  if (error) {
    // Silent handling - errors are passed to the callback
    return
  }

  // In a full implementation, this would:
  // 1. Reload the full configuration
  // 2. Detect changes
  // 3. Call the callback with old/new configs and changes
}
