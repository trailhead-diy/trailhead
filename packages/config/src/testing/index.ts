/**
 * @trailhead/config/testing
 *
 * Configuration testing utilities for config loading, validation testing, and config mocking.
 * Provides domain-focused utilities for testing configuration systems and validation patterns.
 *
 * @example
 * ```typescript
 * import {
 *   createMockConfig,
 *   configFixtures,
 *   assertConfigValid,
 *   createConfigTestScenario,
 * } from '@trailhead/config/testing'
 *
 * // Create mock configuration
 * const mockConfig = createMockConfig()
 * mockConfig.mockConfigFile('app.json', configFixtures.valid.basic)
 *
 * // Test configuration loading
 * const result = await configLoader.load('app.json')
 * assertConfigValid(result, 'app')
 * ```
 */

import { ok, err, type Result, type CoreError } from '@trailhead/core'

// ========================================
// Configuration Types and Interfaces
// ========================================

export interface ConfigSource {
  readonly type: 'file' | 'env' | 'args' | 'default'
  readonly path?: string
  readonly format?: 'json' | 'yaml' | 'toml' | 'ini'
  readonly data: Record<string, any>
  readonly priority: number
}

export interface ConfigValidationRule {
  readonly path: string
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  readonly required?: boolean
  readonly default?: any
  readonly validator?: (value: any) => boolean | string
  readonly description?: string
}

export interface ConfigMergeStrategy {
  readonly arrays: 'replace' | 'merge' | 'append'
  readonly objects: 'replace' | 'merge' | 'deep'
  readonly primitives: 'replace' | 'override'
}

export interface MockConfigLoader {
  readonly sources: Map<string, ConfigSource>
  readonly validationRules: ConfigValidationRule[]
  readonly mergeStrategy: ConfigMergeStrategy
  mockConfigFile(path: string, data: Record<string, any>, format?: ConfigSource['format']): void
  mockEnvironmentVariable(key: string, value: string): void
  mockCommandLineArgs(args: Record<string, any>): void
  loadConfig(configPath?: string): Promise<Result<Record<string, any>, CoreError>>
  validateConfig(
    config: Record<string, any>,
    rules?: ConfigValidationRule[]
  ): Result<Record<string, any>, CoreError>
  mergeConfigs(configs: ConfigSource[]): Record<string, any>
  getLoadHistory(): Array<{ path: string; timestamp: number; success: boolean }>
  clearMocks(): void
}

// ========================================
// Helper Functions
// ========================================

function getValueByPath(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function setValueByPath(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

function validateType(value: any, expectedType: ConfigValidationRule['type']): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'array':
      return Array.isArray(value)
    default:
      return false
  }
}

function deepMerge(target: any, source: any, strategy: ConfigMergeStrategy): any {
  if (source === null || source === undefined) return target
  if (target === null || target === undefined) return source

  if (Array.isArray(source)) {
    switch (strategy.arrays) {
      case 'replace':
        return source
      case 'append':
        return Array.isArray(target) ? [...target, ...source] : source
      case 'merge':
        return Array.isArray(target) ? [...target, ...source] : source
      default:
        return source
    }
  }

  if (typeof source === 'object' && !Array.isArray(source)) {
    const result = strategy.objects === 'replace' ? {} : { ...target }

    for (const [key, value] of Object.entries(source)) {
      if (strategy.objects === 'deep' && typeof value === 'object' && value !== null) {
        result[key] = deepMerge(result[key], value, strategy)
      } else {
        result[key] = value
      }
    }

    return result
  }

  // Primitive values
  return strategy.primitives === 'replace' ? source : target
}

// ========================================
// Mock Configuration Creation
// ========================================

/**
 * Creates a mock configuration loader for testing
 */
export function createMockConfig(
  mergeStrategy: Partial<ConfigMergeStrategy> = {}
): MockConfigLoader {
  const sources = new Map<string, ConfigSource>()
  const validationRules: ConfigValidationRule[] = []
  const loadHistory: Array<{ path: string; timestamp: number; success: boolean }> = []
  const environmentMocks = new Map<string, string>()
  const argsMocks: Record<string, any> = {}

  const finalMergeStrategy: ConfigMergeStrategy = {
    arrays: 'replace',
    objects: 'deep',
    primitives: 'replace',
    ...mergeStrategy,
  }

  return {
    sources,
    validationRules,
    mergeStrategy: finalMergeStrategy,

    mockConfigFile(
      path: string,
      data: Record<string, any>,
      format: ConfigSource['format'] = 'json'
    ): void {
      sources.set(path, {
        type: 'file',
        path,
        format,
        data,
        priority: 100,
      })
    },

    mockEnvironmentVariable(key: string, value: string): void {
      environmentMocks.set(key, value)

      // Create or update env source
      const envSource = sources.get('__env__') || {
        type: 'env' as const,
        data: {},
        priority: 200,
      }

      envSource.data[key] = value
      sources.set('__env__', envSource)
    },

    mockCommandLineArgs(args: Record<string, any>): void {
      Object.assign(argsMocks, args)

      sources.set('__args__', {
        type: 'args',
        data: argsMocks,
        priority: 300,
      })
    },

    async loadConfig(configPath?: string): Promise<Result<Record<string, any>, CoreError>> {
      const timestamp = Date.now()

      try {
        // Determine which sources to load
        const sourcesToLoad: ConfigSource[] = []

        if (configPath) {
          const fileSource = sources.get(configPath)
          if (!fileSource) {
            loadHistory.push({ path: configPath, timestamp, success: false })
            return err({
              type: 'ConfigError',
              code: 'CONFIG_FILE_NOT_FOUND',
              message: `Configuration file not found: ${configPath}`,
              recoverable: true,
              component: 'config',
              operation: 'loadConfig',
              timestamp: new Date(),
              severity: 'medium',
            } as CoreError)
          }
          sourcesToLoad.push(fileSource)
        }

        // Add environment and args sources
        const envSource = sources.get('__env__')
        if (envSource) sourcesToLoad.push(envSource)

        const argsSource = sources.get('__args__')
        if (argsSource) sourcesToLoad.push(argsSource)

        // Merge configurations
        const mergedConfig = this.mergeConfigs(sourcesToLoad)

        // Validate merged configuration
        const validationResult = this.validateConfig(mergedConfig, validationRules)
        if (validationResult.isErr()) {
          loadHistory.push({ path: configPath || 'merged', timestamp, success: false })
          return err(validationResult.error)
        }

        loadHistory.push({ path: configPath || 'merged', timestamp, success: true })
        return ok(validationResult.value)
      } catch (error) {
        loadHistory.push({ path: configPath || 'error', timestamp, success: false })
        return err({
          type: 'ConfigError',
          code: 'CONFIG_LOAD_FAILED',
          message: `Failed to load configuration: ${error}`,
          recoverable: false,
          component: 'config',
          operation: 'loadConfig',
          timestamp: new Date(),
          severity: 'high',
          cause: error,
        } as CoreError)
      }
    },

    validateConfig(
      config: Record<string, any>,
      rules: ConfigValidationRule[] = validationRules
    ): Result<Record<string, any>, CoreError> {
      const validatedConfig = { ...config }
      const errors: string[] = []

      for (const rule of rules) {
        const value = getValueByPath(config, rule.path)

        // Check required fields
        if (rule.required && (value === undefined || value === null)) {
          if (rule.default !== undefined) {
            setValueByPath(validatedConfig, rule.path, rule.default)
          } else {
            errors.push(`Required configuration '${rule.path}' is missing`)
          }
          continue
        }

        // Skip validation if value is undefined and not required
        if (value === undefined || value === null) {
          continue
        }

        // Type validation
        if (!validateType(value, rule.type)) {
          errors.push(
            `Configuration '${rule.path}' must be of type ${rule.type}, got ${typeof value}`
          )
          continue
        }

        // Custom validation
        if (rule.validator) {
          const validationResult = rule.validator(value)
          if (validationResult !== true) {
            const message =
              typeof validationResult === 'string'
                ? validationResult
                : `Configuration '${rule.path}' failed validation`
            errors.push(message)
          }
        }
      }

      if (errors.length > 0) {
        return err({
          type: 'ConfigError',
          code: 'CONFIG_VALIDATION_FAILED',
          message: `Configuration validation failed: ${errors.join(', ')}`,
          details: errors.join('\n'),
          recoverable: true,
          component: 'config',
          operation: 'validateConfig',
          timestamp: new Date(),
          severity: 'medium',
        } as CoreError)
      }

      return ok(validatedConfig)
    },

    mergeConfigs(configs: ConfigSource[]): Record<string, any> {
      // Sort by priority (lower priority first, higher priority overwrites)
      const sortedConfigs = [...configs].sort((a, b) => a.priority - b.priority)

      let merged: Record<string, any> = {}

      for (const config of sortedConfigs) {
        merged = deepMerge(merged, config.data, finalMergeStrategy)
      }

      return merged
    },

    getLoadHistory(): Array<{ path: string; timestamp: number; success: boolean }> {
      return [...loadHistory]
    },

    clearMocks(): void {
      sources.clear()
      validationRules.length = 0
      loadHistory.length = 0
      environmentMocks.clear()
      Object.keys(argsMocks).forEach((key) => delete argsMocks[key])
    },
  }
}

// ========================================
// Configuration Test Fixtures
// ========================================

export const configFixtures = {
  /**
   * Valid configuration examples
   */
  valid: {
    basic: {
      app: {
        name: 'test-app',
        version: '1.0.0',
        debug: false,
      },
      database: {
        host: 'localhost',
        port: 5432,
        name: 'testdb',
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
    },

    complex: {
      app: {
        name: 'complex-app',
        version: '2.1.0',
        debug: true,
        features: ['auth', 'logging', 'metrics'],
      },
      database: {
        primary: {
          host: 'db1.example.com',
          port: 5432,
          ssl: true,
        },
        replica: {
          host: 'db2.example.com',
          port: 5432,
          ssl: true,
        },
      },
      cache: {
        redis: {
          url: 'redis://localhost:6379',
          ttl: 3600,
        },
      },
      logging: {
        level: 'info',
        format: 'json',
        outputs: ['console', 'file'],
      },
    },
  },

  /**
   * Invalid configuration examples
   */
  invalid: {
    missingRequired: {
      app: {
        name: 'test-app',
        // missing version
      },
    },

    wrongTypes: {
      app: {
        name: 123, // should be string
        version: '1.0.0',
        debug: 'true', // should be boolean
      },
      database: {
        port: '5432', // should be number
      },
    },

    invalidValues: {
      app: {
        name: '',
        version: '1.0.0',
      },
      server: {
        port: -1, // invalid port
      },
    },
  },

  /**
   * Environment variable mappings
   */
  environment: {
    development: {
      NODE_ENV: 'development',
      DEBUG: 'true',
      DATABASE_URL: 'postgres://localhost:5432/dev',
      LOG_LEVEL: 'debug',
    },

    production: {
      NODE_ENV: 'production',
      DEBUG: 'false',
      DATABASE_URL: 'postgres://prod-db:5432/app',
      LOG_LEVEL: 'info',
    },
  },

  /**
   * Command line argument examples
   */
  commandLineArgs: {
    basic: {
      port: 8080,
      verbose: true,
      config: '/path/to/config.json',
    },

    override: {
      'app.debug': true,
      'database.host': 'override-host',
      'server.port': 9000,
    },
  },

  /**
   * Validation rules for testing
   */
  validationRules: [
    { path: 'app.name', type: 'string' as const, required: true },
    { path: 'app.version', type: 'string' as const, required: true },
    { path: 'app.debug', type: 'boolean' as const, default: false },
    { path: 'database.host', type: 'string' as const, required: true },
    {
      path: 'database.port',
      type: 'number' as const,
      default: 5432,
      validator: (port: number) => port > 0 && port < 65536,
    },
    {
      path: 'server.port',
      type: 'number' as const,
      default: 3000,
      validator: (port: number) => port > 1024 && port < 65536,
    },
  ],
}

// ========================================
// Configuration Testing Assertions
// ========================================

/**
 * Asserts that configuration loading succeeded
 */
export function assertConfigValid(
  result: Result<Record<string, any>, CoreError>,
  expectedKeys?: string[]
): void {
  if (result.isErr()) {
    throw new Error(`Expected config loading to succeed, but got error: ${result.error.message}`)
  }

  const config = result.value

  if (expectedKeys) {
    for (const key of expectedKeys) {
      if (!(key in config)) {
        throw new Error(`Expected config key '${key}' not found`)
      }
    }
  }
}

/**
 * Asserts that configuration validation failed with expected error
 */
export function assertConfigInvalid(
  result: Result<Record<string, any>, CoreError>,
  expectedErrorCode?: string
): void {
  if (result.isOk()) {
    throw new Error(`Expected config validation to fail, but it succeeded`)
  }

  if (expectedErrorCode && result.error.code !== expectedErrorCode) {
    throw new Error(`Expected error code '${expectedErrorCode}', but got '${result.error.code}'`)
  }
}

/**
 * Asserts that configuration contains expected values
 */
export function assertConfigValues(
  config: Record<string, any>,
  expectedValues: Record<string, any>
): void {
  for (const [path, expectedValue] of Object.entries(expectedValues)) {
    const actualValue = getValueByPath(config, path)

    if (actualValue !== expectedValue) {
      throw new Error(
        `Expected config '${path}' to be ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`
      )
    }
  }
}

/**
 * Asserts that configuration merge strategy worked correctly
 */
export function assertConfigMerge(
  mergedConfig: Record<string, any>,
  originalConfigs: Record<string, any>[],
  expectedOverrides: Record<string, any>
): void {
  for (const [path, expectedValue] of Object.entries(expectedOverrides)) {
    const actualValue = getValueByPath(mergedConfig, path)

    if (actualValue !== expectedValue) {
      throw new Error(
        `Expected merged config '${path}' to be ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`
      )
    }
  }
}

// ========================================
// Configuration Test Scenarios
// ========================================

/**
 * Creates a configuration test scenario
 */
export function createConfigTestScenario(
  options: {
    configFiles?: Array<{ path: string; data: Record<string, any> }>
    environment?: Record<string, string>
    args?: Record<string, any>
    validationRules?: ConfigValidationRule[]
    mergeStrategy?: Partial<ConfigMergeStrategy>
  } = {}
): {
  loader: MockConfigLoader
  loadConfig: (path?: string) => Promise<Result<Record<string, any>, CoreError>>
  validateConfig: (config: Record<string, any>) => Result<Record<string, any>, CoreError>
  cleanup: () => void
} {
  const loader = createMockConfig(options.mergeStrategy)

  // Setup config files
  if (options.configFiles) {
    for (const file of options.configFiles) {
      loader.mockConfigFile(file.path, file.data)
    }
  }

  // Setup environment variables
  if (options.environment) {
    for (const [key, value] of Object.entries(options.environment)) {
      loader.mockEnvironmentVariable(key, value)
    }
  }

  // Setup command line args
  if (options.args) {
    loader.mockCommandLineArgs(options.args)
  }

  // Setup validation rules
  if (options.validationRules) {
    loader.validationRules.push(...options.validationRules)
  }

  return {
    loader,

    async loadConfig(path?: string): Promise<Result<Record<string, any>, CoreError>> {
      return loader.loadConfig(path)
    },

    validateConfig(config: Record<string, any>): Result<Record<string, any>, CoreError> {
      return loader.validateConfig(config)
    },

    cleanup(): void {
      loader.clearMocks()
    },
  }
}

// ========================================
// Export Collections
// ========================================

/**
 * Configuration testing utilities grouped by functionality
 */
export const configTesting = {
  // Mock creation
  createMockConfig,
  createConfigTestScenario,

  // Fixtures and test data
  fixtures: configFixtures,

  // Assertions
  assertConfigValid,
  assertConfigInvalid,
  assertConfigValues,
  assertConfigMerge,
}
