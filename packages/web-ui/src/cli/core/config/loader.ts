import {
  cosmiconfig,
  cosmiconfigSync,
  defaultLoadersSync,
  type CosmiconfigResult,
} from 'cosmiconfig'
import path from 'node:path'
import { z } from 'zod'
import { trailheadConfigSchema, defaultConfig, type TrailheadConfig } from './schema.js'
// Import types from framework
import { Ok, Err, type Result } from '@esteban-url/trailhead-cli'

// Define local error type
type ConfigurationError = {
  code: string
  message: string
  details?: string
  recoverable: boolean
}

// Define local error helpers
const configurationError = (message: string, details?: string): ConfigurationError => ({
  code: 'CONFIG_ERROR',
  message,
  details,
  recoverable: true,
})

const _invalidConfigFieldError = (field: string, message: string): ConfigurationError => ({
  code: 'VALIDATION_ERROR',
  message,
  details: `Field: ${field}`,
  recoverable: true,
})
import { createSilentLogger } from '@esteban-url/trailhead-cli/core'

const logger = createSilentLogger()

/**
 * Module name for cosmiconfig
 */
const MODULE_NAME = 'trailhead'

/**
 * Configuration file search places
 */
const SEARCH_PLACES = [
  `.${MODULE_NAME}rc`,
  `.${MODULE_NAME}rc.json`,
  `.${MODULE_NAME}rc.js`,
  `.${MODULE_NAME}rc.ts`,
  `.${MODULE_NAME}rc.mjs`,
  `.${MODULE_NAME}rc.cjs`,
  `.${MODULE_NAME}rc.yaml`,
  `.${MODULE_NAME}rc.yml`,
  `${MODULE_NAME}.config.js`,
  `${MODULE_NAME}.config.ts`,
  `${MODULE_NAME}.config.mjs`,
  `${MODULE_NAME}.config.cjs`,
  `${MODULE_NAME}.config.json`,
  'package.json',
]

/**
 * Cached configuration result
 */
let cachedConfig: TrailheadConfig | null = null
let cachedFilePath: string | null = null

/**
 * Format Zod validation errors into detailed error messages
 */
function formatZodError(error: z.ZodError, configFile?: string): ConfigurationError {
  const firstError = error.errors[0]

  if (!firstError) {
    return configurationError(
      'Invalid configuration',
      `Config file: ${configFile || 'unknown'}. Check your configuration file for errors.`
    )
  }

  // Build the field path
  const fieldPath = firstError.path.join('.')

  // Get expected type from the error
  let expectedType = 'unknown'
  let exampleValue: unknown

  if (firstError.code === 'invalid_type') {
    expectedType = firstError.expected

    // Provide examples based on type
    switch (firstError.expected) {
      case 'string':
        if (fieldPath.includes('Dir')) {
          exampleValue = 'src/components/lib'
        } else if (fieldPath.includes('framework')) {
          exampleValue = 'nextjs'
        } else {
          exampleValue = 'example-string'
        }
        break
      case 'boolean':
        exampleValue = true
        break
      case 'array':
        if (fieldPath.includes('Transforms')) {
          exampleValue = ['button', 'badge', 'alert']
        } else if (fieldPath.includes('Pattern')) {
          exampleValue = ['**/*.test.tsx', '**/*.spec.tsx']
        } else {
          exampleValue = []
        }
        break
      case 'object':
        exampleValue = {}
        break
    }
  } else if (firstError.code === 'invalid_enum_value') {
    expectedType = `one of: ${firstError.options.join(', ')}`
    exampleValue = firstError.options[0]
  }

  // Get the actual value that was provided
  const actualValue = firstError.code === 'invalid_type' ? firstError.received : undefined

  return configurationError(
    `Configuration error in field '${fieldPath || 'unknown'}': Expected ${expectedType}, got ${JSON.stringify(actualValue)}. Example: ${exampleValue}`
  )
}

/**
 * Load configuration using cosmiconfig
 */
export async function loadConfig(
  startPath?: string
): Promise<Result<{ config: TrailheadConfig; filepath: string | null }>> {
  try {
    // Return cached config if available
    if (cachedConfig) {
      return Ok({ config: cachedConfig, filepath: cachedFilePath })
    }

    const explorer = cosmiconfig(MODULE_NAME, {
      searchPlaces: SEARCH_PLACES,
    })

    const result: CosmiconfigResult = await explorer.search(startPath)

    if (!result || result.isEmpty) {
      // No config found, use defaults
      cachedConfig = defaultConfig
      cachedFilePath = null
      return Ok({ config: defaultConfig, filepath: null })
    }

    // Validate config with Zod
    const parseResult = trailheadConfigSchema.safeParse(result.config)
    if (!parseResult.success) {
      return Err(formatZodError(parseResult.error, result.filepath))
    }

    // Merge with defaults to ensure all fields are present
    const mergedConfig = mergeWithDefaults(parseResult.data)

    // Cache the result
    cachedConfig = mergedConfig
    cachedFilePath = result.filepath

    return Ok({ config: mergedConfig, filepath: result.filepath })
  } catch (error) {
    return Err(
      configurationError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Load config synchronously (for CLI context initialization)
 */
export function loadConfigSync(
  startPath?: string
): Result<{ config: TrailheadConfig; filepath: string | null }> {
  try {
    // Debug logging
    if (startPath) {
      logger.debug(`LoadConfigSync called with startPath: ${startPath}`)
    }
    // Return cached config if available
    if (cachedConfig) {
      return Ok({ config: cachedConfig, filepath: cachedFilePath })
    }

    const explorer = cosmiconfigSync(MODULE_NAME, {
      searchPlaces: SEARCH_PLACES,
      loaders: {
        ...defaultLoadersSync,
        '.ts': defaultLoadersSync['.js'],
        '.mjs': defaultLoadersSync['.js'],
      },
    })

    const result: CosmiconfigResult = explorer.search(startPath)

    if (!result || result.isEmpty) {
      // No config found, use defaults
      cachedConfig = defaultConfig
      cachedFilePath = null
      return Ok({ config: defaultConfig, filepath: null })
    }

    // Validate config with Zod
    const parseResult = trailheadConfigSchema.safeParse(result.config)
    if (!parseResult.success) {
      return Err(formatZodError(parseResult.error, result.filepath))
    }

    // Merge with defaults to ensure all fields are present
    const mergedConfig = mergeWithDefaults(parseResult.data)

    // Cache the result
    cachedConfig = mergedConfig
    cachedFilePath = result.filepath

    return Ok({ config: mergedConfig, filepath: result.filepath })
  } catch (error) {
    return Err(
      configurationError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Clear cached configuration
 */
export function clearConfigCache(): void {
  cachedConfig = null
  cachedFilePath = null
}

/**
 * Merge partial config with defaults
 */
function mergeWithDefaults(config: Partial<TrailheadConfig>): TrailheadConfig {
  return {
    install: config.install
      ? {
          ...defaultConfig.install!,
          ...config.install,
        }
      : defaultConfig.install,
    transforms: config.transforms
      ? {
          ...defaultConfig.transforms!,
          ...config.transforms,
        }
      : defaultConfig.transforms,
    devRefresh: config.devRefresh
      ? {
          ...defaultConfig.devRefresh!,
          ...config.devRefresh,
        }
      : defaultConfig.devRefresh,
    verbose: config.verbose ?? defaultConfig.verbose,
    dryRun: config.dryRun ?? defaultConfig.dryRun,
  }
}

/**
 * Log configuration discovery details
 */
export function logConfigDiscovery(
  filepath: string | null,
  config: TrailheadConfig,
  verbose: boolean = false
): void {
  if (!verbose) return

  if (filepath) {
    logger.info(`Found configuration at: ${path.relative(process.cwd(), filepath)}`)
  } else {
    logger.info('No configuration file found, using defaults')
  }

  logger.debug(`Loaded configuration: ${JSON.stringify(config, null, 2)}`)
}
