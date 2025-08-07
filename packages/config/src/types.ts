import type { Result, CoreError } from '@esteban-url/core'

// ========================================
// Result Type - Use standard Result<T, CoreError>
// ========================================

/**
 * Type aliases for configuration system result and error handling.
 *
 * These types provide consistent error handling throughout the configuration
 * system using the standard Result pattern from @esteban-url/core.
 */
export type ConfigValue = unknown
export type ConfigError = CoreError
export type ConfigResult<T> = Result<T, CoreError>

// ========================================
// Configuration Types
// ========================================

/**
 * Configuration definition interface defining the structure and behavior of configuration.
 *
 * Specifies sources to load from, validation rules, transformation logic,
 * and metadata for a complete configuration system setup.
 *
 * @template T - The type of configuration data this definition describes
 */
export interface ConfigDefinition<T = Record<string, unknown>> {
  readonly name: string
  readonly version?: string
  readonly description?: string
  readonly schema?: unknown // Will be properly typed when imported in operations
  readonly sources: readonly ConfigSource[]
  readonly defaults?: Partial<T>
  readonly transformers?: readonly ConfigTransformer<T>[]
  readonly validators?: readonly ConfigValidator<T>[]
}

/**
 * Configuration source interface defining where configuration data comes from.
 *
 * Describes a single source of configuration data with loading options,
 * priority for merging, and optional features like watching for changes.
 */
export interface ConfigSource {
  readonly type: ConfigSourceType
  readonly path?: string
  readonly data?: Record<string, unknown>
  readonly priority: number
  readonly optional?: boolean
  readonly watch?: boolean
  readonly env?: string
}

/**
 * Configuration source types supported by the system.
 *
 * Defines the available source types for loading configuration data
 * from various locations and formats.
 */
export type ConfigSourceType = 'file' | 'env' | 'cli' | 'object' | 'remote' | 'vault'

/**
 * Configuration schema interface for defining validation rules.
 *
 * Provides structure for validating configuration data with properties,
 * required fields, and custom validation functions.
 *
 * @template T - The type of configuration data this schema validates
 */
export interface ConfigSchema<T = Record<string, unknown>> {
  readonly properties: Record<string, ConfigProperty>
  readonly required?: readonly string[]
  readonly additionalProperties?: boolean
  readonly validate?: (config: T) => ConfigResult<void>
}

/**
 * Configuration property interface defining validation rules for individual fields.
 *
 * Specifies type constraints, validation rules, default values, and
 * transformation logic for configuration properties.
 */
export interface ConfigProperty {
  readonly type: ConfigPropertyType
  readonly description?: string
  readonly default?: unknown
  readonly required?: boolean
  readonly enum?: readonly unknown[]
  readonly pattern?: string
  readonly minimum?: number
  readonly maximum?: number
  readonly minLength?: number
  readonly maxLength?: number
  readonly items?: ConfigProperty
  readonly properties?: Record<string, ConfigProperty>
  readonly transform?: (value: unknown) => unknown
  readonly validate?: (value: unknown) => boolean
}

/**
 * Configuration property types supported by the validation system.
 *
 * Defines the basic types that configuration properties can be validated as.
 */
export type ConfigPropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null'

// ========================================
// Configuration State
// ========================================

/**
 * Configuration state interface representing loaded and processed configuration.
 *
 * Contains the complete state of a configuration including raw data,
 * processed values, source information, and metadata about the loading process.
 *
 * @template T - The type of the resolved configuration data
 */
export interface ConfigState<T = Record<string, unknown>> {
  readonly definition: ConfigDefinition<T>
  readonly raw: Record<string, unknown>
  readonly resolved: T
  readonly sources: readonly ResolvedSource[]
  readonly metadata: ConfigMetadata
}

/**
 * Resolved source interface representing the result of loading from a configuration source.
 *
 * Contains the loaded data, timing information, and any errors that occurred
 * during the loading process from a specific configuration source.
 */
export interface ResolvedSource {
  readonly source: ConfigSource
  readonly data: Record<string, unknown>
  readonly loadTime: number
  readonly error?: CoreError
}

/**
 * Configuration metadata interface containing information about the loading process.
 *
 * Provides timing, validation results, and other metadata about how the
 * configuration was loaded and processed.
 */
export interface ConfigMetadata {
  readonly loadTime: number
  readonly sourceCount: number
  readonly valid: boolean
  readonly validationErrors: readonly CoreError[]
  readonly transformationErrors: readonly CoreError[]
  readonly version?: string
  readonly checksum?: string
}

// ========================================
// Loader Types
// ========================================

/**
 * Configuration loader interface for implementing source-specific loaders.
 *
 * Defines the contract for loaders that can fetch configuration data from
 * specific source types with optional change watching capabilities.
 */
export interface ConfigLoader {
  readonly load: (source: ConfigSource) => Promise<ConfigResult<Record<string, unknown>>>
  readonly watch?: (
    source: ConfigSource,
    callback: ConfigWatchCallback
  ) => Promise<ConfigResult<ConfigWatcher>>
  readonly supports: (source: ConfigSource) => boolean
}

/**
 * Configuration watch callback type for handling configuration changes.
 *
 * Called when a watched configuration source detects changes with the new
 * data or any error that occurred during the reload process.
 */
export type ConfigWatchCallback = (data: Record<string, unknown>, error?: CoreError) => void

/**
 * Configuration watcher interface for managing ongoing configuration monitoring.
 *
 * Represents an active watch operation on a configuration source with
 * the ability to stop watching when no longer needed.
 */
export interface ConfigWatcher {
  readonly source: ConfigSource
  readonly stop: () => Promise<ConfigResult<void>>
}

// ========================================
// Transformer Types
// ========================================

/**
 * Configuration transformer interface for modifying configuration data.
 *
 * Defines transformers that can modify configuration data during the loading
 * process, such as environment variable expansion or format conversion.
 *
 * @template T - The type of configuration data after transformation
 */
export interface ConfigTransformer<T = Record<string, unknown>> {
  readonly name: string
  readonly transform: (config: Record<string, unknown>) => ConfigResult<T>
  readonly priority?: number
}

// ========================================
// Validator Types
// ========================================

/**
 * Configuration validator interface for custom validation logic.
 *
 * Defines validators that can perform complex business logic validation
 * beyond basic schema validation, such as connectivity checks or
 * environment-specific constraints.
 *
 * @template T - The type of configuration data being validated
 */
export interface ConfigValidator<T = Record<string, unknown>> {
  readonly name: string
  readonly schema?: unknown // Schema will be properly typed when imported
  readonly validate: (config: unknown) => Promise<ConfigResult<T>>
  readonly priority?: number
}

// ========================================
// Operations Types
// ========================================

/**
 * Configuration operations interface providing the main API for configuration management.
 *
 * Defines the core operations for creating managers, loading configuration,
 * watching for changes, and performing validation and transformation.
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
 * Provides registration and management capabilities for loaders that can
 * fetch configuration data from various source types.
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
 * Provides registration and management capabilities for custom validators
 * that perform business logic validation beyond schema validation.
 */
export interface ValidatorOperations {
  readonly register: <T>(validator: ConfigValidator<T>) => void
  readonly unregister: (name: string) => void
  readonly validate: <T>(
    config: T,
    validators: readonly ConfigValidator<T>[]
  ) => Promise<Result<void, CoreError>>
  readonly validateSchema: <T>(config: T, schema: unknown) => Result<void, CoreError>
  readonly getRegisteredValidators: () => readonly string[]
  readonly hasValidator: (name: string) => boolean
}

/**
 * Transformer operations interface for managing configuration transformers.
 *
 * Provides registration and management capabilities for transformers that
 * can modify configuration data during the loading process.
 */
export interface TransformerOperations {
  readonly register: <T>(transformer: ConfigTransformer<T>) => void
  readonly unregister: (name: string) => void
  readonly transform: <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ) => ConfigResult<T>
}

// ========================================
// Manager Types
// ========================================

/**
 * Configuration manager interface providing lifecycle management for configuration.
 *
 * Manages the complete lifecycle of configuration including loading, watching,
 * validation, and providing access to configuration values with type safety.
 *
 * @template T - The type of configuration data being managed
 */
export interface ConfigManager<T = Record<string, unknown>> {
  readonly definition: ConfigDefinition<T>
  readonly load: () => Promise<ConfigResult<ConfigState<T>>>
  readonly reload: () => Promise<ConfigResult<ConfigState<T>>>
  readonly get: <K extends keyof T>(key: K) => T[K] | undefined
  readonly set: <K extends keyof T>(key: K, value: T[K]) => ConfigResult<void>
  readonly has: (key: keyof T) => boolean
  readonly watch: (callback: ConfigChangeCallback<T>) => Promise<ConfigResult<ConfigWatcher[]>>
  readonly validate: () => Promise<ConfigResult<void>>
  readonly getState: () => ConfigState<T> | undefined
  readonly getMetadata: () => ConfigMetadata | undefined
}

/**
 * Configuration change callback type for handling configuration updates.
 *
 * Called when configuration changes are detected during watching with
 * the new configuration, previous configuration, and detailed change information.
 *
 * @template T - The type of configuration data
 */
export type ConfigChangeCallback<T = Record<string, unknown>> = (
  newConfig: T,
  oldConfig: T,
  changes: readonly ConfigChange[]
) => void

/**
 * Configuration change interface describing individual configuration changes.
 *
 * Provides detailed information about what changed including the path,
 * old and new values, and the source that triggered the change.
 */
export interface ConfigChange {
  readonly path: string
  readonly oldValue: unknown
  readonly newValue: unknown
  readonly source: ConfigSource
}

// ========================================
// Built-in Types
// ========================================

/**
 * File loader options interface for configuring file-based configuration loading.
 *
 * Provides options for controlling how configuration files are loaded including
 * encoding, size limits, and allowed file extensions.
 */
export interface FileLoaderOptions {
  readonly encoding?: BufferEncoding
  readonly maxSize?: number
  readonly allowedExtensions?: readonly string[]
}

/**
 * Environment loader options interface for configuring environment variable loading.
 *
 * Provides options for controlling how environment variables are processed
 * including prefixes, separators, and type parsing behavior.
 */
export interface EnvLoaderOptions {
  readonly prefix?: string
  readonly separator?: string
  readonly parseNumbers?: boolean
  readonly parseBooleans?: boolean
  readonly allowEmpty?: boolean
}

/**
 * CLI loader options interface for configuring command-line argument loading.
 *
 * Provides options for controlling how command-line arguments are processed
 * including prefixes, separators, type parsing, and argument aliases.
 */
export interface CLILoaderOptions {
  readonly prefix?: string
  readonly separator?: string
  readonly parseNumbers?: boolean
  readonly parseBooleans?: boolean
  readonly aliases?: Record<string, string>
}

// ========================================
// Utility Types
// ========================================

/**
 * Deep partial type utility for making all properties optional recursively.
 *
 * Creates a type where all properties of T and nested objects are optional,
 * useful for configuration defaults and partial updates.
 *
 * @template T - The type to make deeply partial
 */
export type DeepPartial<T> = {
  readonly [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer U)[]
      ? readonly DeepPartial<U>[]
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P]
}

/**
 * Configuration path type utility for generating dot-notation paths.
 *
 * Creates a union of string literals representing all possible dot-notation
 * paths through an object type, useful for type-safe property access.
 *
 * @template T - The type to generate paths for
 *
 * @example
 * ```typescript
 * type ServerConfig = { server: { host: string; port: number } }
 * type Paths = ConfigPath<ServerConfig> // 'server' | 'server.host' | 'server.port'
 * ```
 */
export type ConfigPath<T> = T extends object
  ? {
      readonly [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${ConfigPath<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never
