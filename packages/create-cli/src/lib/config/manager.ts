import { ok, err, createCoreError } from '@esteban-url/core'
import type { Result, CoreError } from '@esteban-url/core'
import { readFile, writeFile, exists, defaultFSConfig } from '@esteban-url/fs'
import { resolve } from 'path'
import {
  validateConfigFile,
  validatePresetConfig,
  createConfigFile,
  mergePresetWithConfig,
  generateConfigJsonSchema,
  type ConfigFile,
  type PresetConfig,
} from './schema.js'
import type { ProjectConfig } from './types.js'

// ========================================
// Functional Config Management API
// ========================================

/**
 * Configuration context for functional config operations
 */
export interface ConfigContext {
  readonly configDir: string
  readonly presetDir: string
  readonly verbose: boolean
}

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
  configDir?: string
  presetDir?: string
  verbose?: boolean
}

/**
 * Create a configuration context with the specified options
 *
 * @param options - Configuration options
 * @returns Configuration context
 */
export function createConfigContext(options: ConfigManagerOptions = {}): ConfigContext {
  const configDir = options.configDir || resolve(process.cwd(), '.trailhead')
  const presetDir = options.presetDir || resolve(configDir, 'presets')

  return {
    configDir,
    presetDir,
    verbose: options.verbose || false,
  }
}

/**
 * Ensure configuration directory exists
 *
 * @param context - Configuration context
 * @returns Result indicating success or error
 */
export async function ensureConfigDirectory(
  context: ConfigContext
): Promise<Result<void, CoreError>> {
  try {
    const { mkdir } = await import('node:fs/promises')
    await mkdir(context.configDir, { recursive: true })
    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'CONFIG_DIR_CREATION_FAILED',
        'CLI_ERROR',
        `Failed to create config directory: ${context.configDir}`,
        {
          component: 'ConfigManager',
          operation: 'ensureConfigDirectory',
          cause: error,
          recoverable: false,
        }
      )
    )
  }
}

/**
 * Ensure preset directory exists
 *
 * @param context - Configuration context
 * @returns Result indicating success or error
 */
export async function ensurePresetDirectory(
  context: ConfigContext
): Promise<Result<void, CoreError>> {
  try {
    const { mkdir } = await import('node:fs/promises')
    await mkdir(context.presetDir, { recursive: true })
    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'PRESET_DIR_CREATION_FAILED',
        'CLI_ERROR',
        `Failed to create preset directory: ${context.presetDir}`,
        {
          component: 'ConfigManager',
          operation: 'ensurePresetDirectory',
          cause: error,
          recoverable: false,
        }
      )
    )
  }
}

/**
 * Save configuration to file
 *
 * @param config - Project configuration to save
 * @param filename - Configuration filename
 * @param context - Configuration context
 * @returns Result with saved file path or error
 */
export async function saveConfig(
  config: ProjectConfig,
  filename: string = 'config.json',
  context: ConfigContext
): Promise<Result<string, CoreError>> {
  try {
    const configFile = createConfigFile(config)
    const configPath = resolve(context.configDir, filename)

    // Ensure config directory exists
    const ensureDirResult = await ensureConfigDirectory(context)
    if (ensureDirResult.isErr()) {
      return err(ensureDirResult.error)
    }

    // Write config file
    const content = JSON.stringify(configFile, null, 2)
    const writeResult = await writeFile(defaultFSConfig)(configPath, content)

    if (writeResult.isErr()) {
      return err(
        createCoreError('CONFIG_SAVE_FAILED', 'CLI_ERROR', 'Failed to save configuration file', {
          component: 'ConfigManager',
          operation: 'saveConfig',
          cause: writeResult.error,
          context: { configPath },
          recoverable: false,
        })
      )
    }

    if (context.verbose) {
      console.log(`Configuration saved to ${configPath}`)
    }

    return ok(configPath)
  } catch (error) {
    return err(
      createCoreError('CONFIG_SAVE_ERROR', 'CLI_ERROR', 'Configuration save error', {
        component: 'ConfigManager',
        operation: 'saveConfig',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * Load configuration from file
 *
 * @param filename - Configuration filename
 * @param context - Configuration context
 * @returns Result with loaded configuration or error
 */
export async function loadConfig(
  filename: string = 'config.json',
  context: ConfigContext
): Promise<Result<ConfigFile, CoreError>> {
  try {
    const configPath = resolve(context.configDir, filename)

    // Check if file exists
    const fileExists = await exists(defaultFSConfig)(configPath)
    if (fileExists.isErr() || !fileExists.value) {
      return err(
        createCoreError(
          'CONFIG_NOT_FOUND',
          'CLI_ERROR',
          `Configuration file not found: ${filename}`,
          {
            component: 'ConfigManager',
            operation: 'loadConfig',
            context: { configPath },
            recoverable: true,
          }
        )
      )
    }

    // Read and parse config file
    const readResult = await readFile(defaultFSConfig)(configPath)
    if (readResult.isErr()) {
      return err(
        createCoreError('CONFIG_READ_FAILED', 'CLI_ERROR', 'Failed to read configuration file', {
          component: 'ConfigManager',
          operation: 'loadConfig',
          cause: readResult.error,
          context: { configPath },
          recoverable: false,
        })
      )
    }

    try {
      const configData = JSON.parse(readResult.value)
      const validation = validateConfigFile(configData)

      if (validation.isErr()) {
        return err(
          createCoreError(
            'CONFIG_VALIDATION_FAILED',
            'CLI_ERROR',
            'Configuration file validation failed',
            {
              component: 'ConfigManager',
              operation: 'loadConfig',
              cause: validation.error,
              context: { configPath },
              recoverable: false,
            }
          )
        )
      }

      if (context.verbose) {
        console.log(`Configuration loaded from ${configPath}`)
      }

      return ok(validation.value)
    } catch (parseError) {
      return err(
        createCoreError('CONFIG_PARSE_FAILED', 'CLI_ERROR', 'Failed to parse configuration file', {
          component: 'ConfigManager',
          operation: 'loadConfig',
          cause: parseError,
          context: { configPath },
          recoverable: false,
        })
      )
    }
  } catch (error) {
    return err(
      createCoreError('CONFIG_LOAD_ERROR', 'CLI_ERROR', 'Configuration load error', {
        component: 'ConfigManager',
        operation: 'loadConfig',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * Save preset configuration
 *
 * @param preset - Preset configuration to save
 * @param filename - Optional preset filename
 * @param context - Configuration context
 * @returns Result with saved file path or error
 */
export async function savePreset(
  preset: PresetConfig,
  filename: string | undefined,
  context: ConfigContext
): Promise<Result<string, CoreError>> {
  try {
    const presetFilename = filename || `${preset.name}.json`
    const presetPath = resolve(context.presetDir, presetFilename)

    // Ensure preset directory exists
    const ensureDirResult = await ensurePresetDirectory(context)
    if (ensureDirResult.isErr()) {
      return err(ensureDirResult.error)
    }

    // Validate preset
    const validationResult = validatePresetConfig(preset)
    if (validationResult.isErr()) {
      return err(
        createCoreError('PRESET_VALIDATION_FAILED', 'CLI_ERROR', 'Preset validation failed', {
          component: 'ConfigManager',
          operation: 'savePreset',
          cause: validationResult.error,
          recoverable: false,
        })
      )
    }

    // Write preset file
    const content = JSON.stringify(validationResult.value, null, 2)
    const writeResult = await writeFile(defaultFSConfig)(presetPath, content)

    if (writeResult.isErr()) {
      return err(
        createCoreError('PRESET_SAVE_FAILED', 'CLI_ERROR', 'Failed to save preset', {
          component: 'ConfigManager',
          operation: 'savePreset',
          cause: writeResult.error,
          context: { presetPath },
          recoverable: false,
        })
      )
    }

    if (context.verbose) {
      console.log(`Preset saved to ${presetPath}`)
    }

    return ok(presetPath)
  } catch (error) {
    return err(
      createCoreError('PRESET_SAVE_ERROR', 'CLI_ERROR', 'Preset save error', {
        component: 'ConfigManager',
        operation: 'savePreset',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * Load preset configuration
 *
 * @param name - Preset name
 * @param context - Configuration context
 * @returns Result with loaded preset or error
 */
export async function loadPreset(
  name: string,
  context: ConfigContext
): Promise<Result<PresetConfig, CoreError>> {
  try {
    // Check built-in presets first
    const builtInPreset = BUILT_IN_PRESETS.find((p) => p.name === name)
    if (builtInPreset) {
      if (context.verbose) {
        console.log(`Loaded built-in preset: ${name}`)
      }
      return ok(builtInPreset)
    }

    // Try to load from file
    const presetPath = resolve(context.presetDir, `${name}.json`)
    const fileExists = await exists(defaultFSConfig)(presetPath)

    if (fileExists.isErr() || !fileExists.value) {
      return err(
        createCoreError('PRESET_NOT_FOUND', 'CLI_ERROR', `Preset not found: ${name}`, {
          component: 'ConfigManager',
          operation: 'loadPreset',
          context: { presetPath },
          recoverable: true,
        })
      )
    }

    const readResult = await readFile(defaultFSConfig)(presetPath)
    if (readResult.isErr()) {
      return err(
        createCoreError('PRESET_READ_FAILED', 'CLI_ERROR', 'Failed to read preset file', {
          component: 'ConfigManager',
          operation: 'loadPreset',
          cause: readResult.error,
          context: { presetPath },
          recoverable: false,
        })
      )
    }

    try {
      const presetData = JSON.parse(readResult.value)
      const validation = validatePresetConfig(presetData)

      if (validation.isErr()) {
        return err(
          createCoreError('PRESET_VALIDATION_FAILED', 'CLI_ERROR', 'Preset validation failed', {
            component: 'ConfigManager',
            operation: 'loadPreset',
            cause: validation.error,
            context: { presetPath },
            recoverable: false,
          })
        )
      }

      if (context.verbose) {
        console.log(`Preset loaded from ${presetPath}`)
      }

      return ok(validation.value)
    } catch (parseError) {
      return err(
        createCoreError('PRESET_PARSE_FAILED', 'CLI_ERROR', 'Failed to parse preset file', {
          component: 'ConfigManager',
          operation: 'loadPreset',
          cause: parseError,
          context: { presetPath },
          recoverable: false,
        })
      )
    }
  } catch (error) {
    return err(
      createCoreError('PRESET_LOAD_ERROR', 'CLI_ERROR', 'Preset load error', {
        component: 'ConfigManager',
        operation: 'loadPreset',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * List available presets
 *
 * @param context - Configuration context
 * @returns Result with preset names or error
 */
export async function listPresets(context: ConfigContext): Promise<Result<string[], CoreError>> {
  try {
    const presets: string[] = []

    // Add built-in presets
    presets.push(...BUILT_IN_PRESETS.map((p) => p.name))

    // Add custom presets from directory
    try {
      const { readdir } = await import('node:fs/promises')
      const files = await readdir(context.presetDir)
      const customPresets = files
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''))
        .filter((name) => !BUILT_IN_PRESETS.some((p) => p.name === name))

      presets.push(...customPresets)
    } catch {
      // Directory doesn't exist or can't be read - just use built-in presets
    }

    return ok(presets)
  } catch (error) {
    return err(
      createCoreError('PRESET_LIST_ERROR', 'CLI_ERROR', 'Failed to list presets', {
        component: 'ConfigManager',
        operation: 'listPresets',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * Apply preset to configuration
 *
 * @param config - Base configuration
 * @param presetName - Preset name to apply
 * @param context - Configuration context
 * @returns Result with merged configuration or error
 */
export async function applyPreset(
  config: ProjectConfig,
  presetName: string,
  context: ConfigContext
): Promise<Result<ProjectConfig, CoreError>> {
  try {
    const presetResult = await loadPreset(presetName, context)
    if (presetResult.isErr()) {
      return err(presetResult.error)
    }

    const mergedConfig = mergePresetWithConfig(presetResult.value, config)
    return ok(mergedConfig as ProjectConfig)
  } catch (error) {
    return err(
      createCoreError('PRESET_APPLY_ERROR', 'CLI_ERROR', 'Failed to apply preset', {
        component: 'ConfigManager',
        operation: 'applyPreset',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * Generate JSON schema file
 *
 * @param context - Configuration context
 * @returns Result with schema file path or error
 */
export async function generateSchemaFile(
  context: ConfigContext
): Promise<Result<string, CoreError>> {
  try {
    const schema = generateConfigJsonSchema()
    const schemaPath = resolve(context.configDir, 'config.schema.json')

    // Ensure config directory exists
    const ensureDirResult = await ensureConfigDirectory(context)
    if (ensureDirResult.isErr()) {
      return err(ensureDirResult.error)
    }

    const content = JSON.stringify(schema, null, 2)
    const writeResult = await writeFile(defaultFSConfig)(schemaPath, content)

    if (writeResult.isErr()) {
      return err(
        createCoreError('SCHEMA_SAVE_FAILED', 'CLI_ERROR', 'Failed to save schema file', {
          component: 'ConfigManager',
          operation: 'generateSchemaFile',
          cause: writeResult.error,
          context: { schemaPath },
          recoverable: false,
        })
      )
    }

    return ok(schemaPath)
  } catch (error) {
    return err(
      createCoreError('SCHEMA_GENERATION_ERROR', 'CLI_ERROR', 'Schema generation error', {
        component: 'ConfigManager',
        operation: 'generateSchemaFile',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * Cleanup old configuration files
 *
 * @param maxAge - Maximum age in days
 * @param context - Configuration context
 * @returns Result with number of cleaned files or error
 */
export async function cleanupOldConfigs(
  maxAge: number = 30,
  context: ConfigContext
): Promise<Result<number, CoreError>> {
  try {
    let cleanedCount = 0
    const cutoffTime = Date.now() - maxAge * 24 * 60 * 60 * 1000

    const { readdir, stat, unlink } = await import('node:fs/promises')

    try {
      const files = await readdir(context.configDir)

      for (const file of files) {
        if (file.endsWith('.json') && file !== 'config.schema.json') {
          const filePath = resolve(context.configDir, file)
          const stats = await stat(filePath)

          if (stats.mtime.getTime() < cutoffTime) {
            await unlink(filePath)
            cleanedCount++
            if (context.verbose) {
              console.log(`Cleaned up old config file: ${file}`)
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read - nothing to clean
    }

    return ok(cleanedCount)
  } catch (error) {
    return err(
      createCoreError('CLEANUP_ERROR', 'CLI_ERROR', 'Failed to cleanup old configs', {
        component: 'ConfigManager',
        operation: 'cleanupOldConfigs',
        cause: error,
        recoverable: false,
      })
    )
  }
}

// ========================================
// Built-in Presets and Exports
// ========================================

/**
 * Built-in presets for common project types
 */
export const BUILT_IN_PRESETS: PresetConfig[] = [
  {
    name: 'basic-cli',
    description: 'Basic CLI application with essential features',
    projectType: 'standalone-cli',
    features: {
      core: true,
      testing: true,
      docs: false,
      cicd: false,
    },
    packageManager: 'pnpm',
    nodeVersion: '18',
    ide: 'vscode',
    includeDocs: false,
    installDependencies: true,
  },
  {
    name: 'advanced-cli',
    description: 'Full-featured CLI application with all capabilities',
    projectType: 'standalone-cli',
    features: {
      core: true,
      config: true,
      validation: true,
      testing: true,
      docs: true,
      cicd: true,
    },
    packageManager: 'pnpm',
    nodeVersion: '18',
    ide: 'vscode',
    includeDocs: true,
    installDependencies: true,
  },
  {
    name: 'library',
    description: 'Reusable library package',
    projectType: 'library',
    features: {
      core: true,
      validation: true,
      testing: true,
      docs: true,
      cicd: true,
    },
    packageManager: 'pnpm',
    nodeVersion: '18',
    ide: 'vscode',
    includeDocs: true,
    installDependencies: true,
  },
  {
    name: 'monorepo-package',
    description: 'Package within a monorepo',
    projectType: 'monorepo-package',
    features: {
      core: true,
      testing: true,
      docs: false,
      cicd: false,
    },
    packageManager: 'pnpm',
    nodeVersion: '18',
    ide: 'vscode',
    includeDocs: false,
    installDependencies: false,
  },
]

// Re-export types for convenience
export type { PresetConfig } from './schema.js'
