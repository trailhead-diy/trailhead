import { ok, err, createCoreError } from '@esteban-url/core'
import type { Result } from '@esteban-url/core'
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
  // type ModernProjectConfigValidated,
} from './config-schema.js'
import type { ModernProjectConfig } from './interactive-prompts.js'

/**
 * Configuration manager for create-trailhead-cli
 * Handles loading, saving, and validating configuration files
 */

export interface ConfigManagerOptions {
  configDir?: string
  presetDir?: string
  verbose?: boolean
}

export class ConfigManager {
  private configDir: string
  private presetDir: string
  private verbose: boolean

  constructor(options: ConfigManagerOptions = {}) {
    this.configDir = options.configDir || resolve(process.cwd(), '.trailhead')
    this.presetDir = options.presetDir || resolve(this.configDir, 'presets')
    this.verbose = options.verbose || false
  }

  /**
   * Save configuration to file
   */
  async saveConfig(
    config: ModernProjectConfig,
    filename = 'config.json'
  ): Promise<Result<string, any>> {
    try {
      const configFile = createConfigFile(config)
      const configPath = resolve(this.configDir, filename)

      // Ensure config directory exists
      const ensureDirResult = await this.ensureConfigDirectory()
      if (ensureDirResult.isErr()) {
        return err(ensureDirResult.error)
      }

      // Write config file
      const content = JSON.stringify(configFile, null, 2)
      const writeResult = await writeFile(defaultFSConfig)(configPath, content)

      if (writeResult.isErr()) {
        return err(
          createCoreError('CONFIG_SAVE_FAILED', 'Failed to save configuration file', {
            component: 'create-trailhead-cli',
            operation: 'saveConfig',
            cause: writeResult.error,
            details: `Could not write to ${configPath}`,
          })
        )
      }

      if (this.verbose) {
        console.log(`Configuration saved to ${configPath}`)
      }

      return ok(configPath)
    } catch (error) {
      return err(
        createCoreError('CONFIG_SAVE_ERROR', 'Configuration save error', {
          component: 'create-trailhead-cli',
          operation: 'saveConfig',
          cause: error,
          recoverable: false,
        })
      )
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfig(filename = 'config.json'): Promise<Result<ConfigFile, any>> {
    try {
      const configPath = resolve(this.configDir, filename)

      // Check if file exists
      const fileExists = await exists(defaultFSConfig)(configPath)
      if (fileExists.isErr() || !fileExists.value) {
        return err(
          createCoreError('CONFIG_NOT_FOUND', `Configuration file not found: ${filename}`, {
            component: 'create-trailhead-cli',
            operation: 'loadConfig',
            details: `Looked for config at ${configPath}`,
            recoverable: true,
            severity: 'medium',
          })
        )
      }

      // Read file content
      const readResult = await readFile(defaultFSConfig)(configPath)
      if (readResult.isErr()) {
        return err(
          createCoreError('CONFIG_READ_FAILED', 'Failed to read configuration file', {
            component: 'create-trailhead-cli',
            operation: 'loadConfig',
            cause: readResult.error,
            details: `Could not read ${configPath}`,
          })
        )
      }

      // Parse JSON
      let parsedConfig: unknown
      try {
        parsedConfig = JSON.parse(readResult.value)
      } catch (parseError) {
        return err(
          createCoreError('CONFIG_PARSE_FAILED', 'Failed to parse configuration file', {
            component: 'create-trailhead-cli',
            operation: 'loadConfig',
            cause: parseError,
            details: `Invalid JSON in ${configPath}`,
          })
        )
      }

      // Validate configuration
      const validationResult = validateConfigFile(parsedConfig)
      if (validationResult.isErr()) {
        return validationResult
      }

      if (this.verbose) {
        console.log(`Configuration loaded from ${configPath}`)
      }

      return ok(validationResult.value)
    } catch (error) {
      return err(
        createCoreError('CONFIG_LOAD_ERROR', 'Configuration load error', {
          component: 'create-trailhead-cli',
          operation: 'loadConfig',
          cause: error,
          recoverable: false,
        })
      )
    }
  }

  /**
   * Save preset configuration
   */
  async savePreset(preset: PresetConfig, filename?: string): Promise<Result<string, any>> {
    try {
      const presetFilename = filename || `${preset.name}.json`
      const presetPath = resolve(this.presetDir, presetFilename)

      // Ensure preset directory exists
      const ensureDirResult = await this.ensurePresetDirectory()
      if (ensureDirResult.isErr()) {
        return err(ensureDirResult.error)
      }

      // Validate preset
      const validationResult = validatePresetConfig(preset)
      if (validationResult.isErr()) {
        return err(validationResult.error)
      }

      // Write preset file
      const content = JSON.stringify(validationResult.value, null, 2)
      const writeResult = await writeFile(defaultFSConfig)(presetPath, content)

      if (writeResult.isErr()) {
        return err(
          createCoreError('PRESET_SAVE_FAILED', 'Failed to save preset', {
            component: 'create-trailhead-cli',
            operation: 'savePreset',
            cause: writeResult.error,
            details: `Could not write to ${presetPath}`,
          })
        )
      }

      if (this.verbose) {
        console.log(`Preset saved to ${presetPath}`)
      }

      return ok(presetPath)
    } catch (error) {
      return err(
        createCoreError('PRESET_SAVE_ERROR', 'Preset save error', {
          component: 'create-trailhead-cli',
          operation: 'savePreset',
          cause: error,
          recoverable: false,
        })
      )
    }
  }

  /**
   * Load preset configuration
   */
  async loadPreset(name: string): Promise<Result<PresetConfig, any>> {
    try {
      const presetFilename = name.endsWith('.json') ? name : `${name}.json`
      const presetPath = resolve(this.presetDir, presetFilename)

      // Check if file exists
      const fileExists = await exists(defaultFSConfig)(presetPath)
      if (fileExists.isErr() || !fileExists.value) {
        return err(
          createCoreError('PRESET_NOT_FOUND', `Preset not found: ${name}`, {
            component: 'create-trailhead-cli',
            operation: 'loadPreset',
            details: `Looked for preset at ${presetPath}`,
            recoverable: true,
            severity: 'medium',
          })
        )
      }

      // Read file content
      const readResult = await readFile(defaultFSConfig)(presetPath)
      if (readResult.isErr()) {
        return err(
          createCoreError('PRESET_READ_FAILED', 'Failed to read preset file', {
            component: 'create-trailhead-cli',
            operation: 'loadPreset',
            cause: readResult.error,
            details: `Could not read ${presetPath}`,
          })
        )
      }

      // Parse JSON
      let parsedPreset: unknown
      try {
        parsedPreset = JSON.parse(readResult.value)
      } catch (parseError) {
        return err(
          createCoreError('PRESET_PARSE_FAILED', 'Failed to parse preset file', {
            component: 'create-trailhead-cli',
            operation: 'loadPreset',
            cause: parseError,
            details: `Invalid JSON in ${presetPath}`,
          })
        )
      }

      // Validate preset
      const validationResult = validatePresetConfig(parsedPreset)
      if (validationResult.isErr()) {
        return validationResult
      }

      if (this.verbose) {
        console.log(`Preset loaded from ${presetPath}`)
      }

      return ok(validationResult.value)
    } catch (error) {
      return err(
        createCoreError('PRESET_LOAD_ERROR', 'Preset load error', {
          component: 'create-trailhead-cli',
          operation: 'loadPreset',
          cause: error,
          recoverable: false,
        })
      )
    }
  }

  /**
   * List available presets
   */
  async listPresets(): Promise<Result<string[], any>> {
    try {
      const { readdir } = await import('node:fs/promises')

      // Check if preset directory exists
      const dirExists = await exists(defaultFSConfig)(this.presetDir)
      if (dirExists.isErr() || !dirExists.value) {
        return ok([]) // No presets directory means no presets
      }

      const files = await readdir(this.presetDir)
      const presetFiles = files
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''))

      return ok(presetFiles)
    } catch (error) {
      return err(
        createCoreError('PRESET_LIST_ERROR', 'Failed to list presets', {
          component: 'create-trailhead-cli',
          operation: 'listPresets',
          cause: error,
          recoverable: true,
        })
      )
    }
  }

  /**
   * Apply preset to configuration
   */
  async applyPreset(
    presetName: string,
    userConfig: Partial<ModernProjectConfig>
  ): Promise<Result<Partial<ModernProjectConfig>, any>> {
    try {
      const presetResult = await this.loadPreset(presetName)
      if (presetResult.isErr()) {
        return err(presetResult.error)
      }

      const preset = presetResult.value
      const mergedConfig = mergePresetWithConfig(preset, userConfig)

      if (this.verbose) {
        console.log(`Applied preset: ${preset.name}`)
      }

      return ok(mergedConfig)
    } catch (error) {
      return err(
        createCoreError('PRESET_APPLY_ERROR', 'Failed to apply preset', {
          component: 'create-trailhead-cli',
          operation: 'applyPreset',
          cause: error,
          recoverable: false,
        })
      )
    }
  }

  /**
   * Generate JSON schema file for IDE support
   */
  async generateSchemaFile(): Promise<Result<string, any>> {
    try {
      const schema = generateConfigJsonSchema()
      const schemaPath = resolve(this.configDir, 'config.schema.json')

      // Ensure config directory exists
      const ensureDirResult = await this.ensureConfigDirectory()
      if (ensureDirResult.isErr()) {
        return err(ensureDirResult.error)
      }

      // Write schema file
      const content = JSON.stringify(schema, null, 2)
      const writeResult = await writeFile(defaultFSConfig)(schemaPath, content)

      if (writeResult.isErr()) {
        return err(
          createCoreError('SCHEMA_SAVE_FAILED', 'Failed to save JSON schema', {
            component: 'create-trailhead-cli',
            operation: 'generateSchemaFile',
            cause: writeResult.error,
            details: `Could not write to ${schemaPath}`,
          })
        )
      }

      if (this.verbose) {
        console.log(`JSON schema saved to ${schemaPath}`)
      }

      return ok(schemaPath)
    } catch (error) {
      return err(
        createCoreError('SCHEMA_GENERATE_ERROR', 'Schema generation error', {
          component: 'create-trailhead-cli',
          operation: 'generateSchemaFile',
          cause: error,
          recoverable: false,
        })
      )
    }
  }

  /**
   * Clean up old configuration files
   */
  async cleanup(maxAge = 30): Promise<Result<number, any>> {
    try {
      const { readdir, stat, unlink } = await import('node:fs/promises')

      // Check if config directory exists
      const dirExists = await exists(defaultFSConfig)(this.configDir)
      if (dirExists.isErr() || !dirExists.value) {
        return ok(0) // No directory means nothing to clean
      }

      const files = await readdir(this.configDir)
      const now = Date.now()
      const maxAgeMs = maxAge * 24 * 60 * 60 * 1000 // Convert days to milliseconds

      let cleanedCount = 0

      for (const file of files) {
        if (!file.endsWith('.json') || file === 'config.json') {
          continue // Skip non-JSON files and main config
        }

        const filePath = resolve(this.configDir, file)
        const stats = await stat(filePath)

        if (now - stats.mtime.getTime() > maxAgeMs) {
          await unlink(filePath)
          cleanedCount++

          if (this.verbose) {
            console.log(`Cleaned up old config: ${file}`)
          }
        }
      }

      return ok(cleanedCount)
    } catch (error) {
      return err(
        createCoreError('CONFIG_CLEANUP_ERROR', 'Configuration cleanup error', {
          component: 'create-trailhead-cli',
          operation: 'cleanup',
          cause: error,
          recoverable: true,
        })
      )
    }
  }

  /**
   * Get configuration directory path
   */
  getConfigDir(): string {
    return this.configDir
  }

  /**
   * Get preset directory path
   */
  getPresetDir(): string {
    return this.presetDir
  }

  /**
   * Ensure configuration directory exists
   */
  private async ensureConfigDirectory(): Promise<Result<void, any>> {
    try {
      const { mkdir } = await import('node:fs/promises')
      await mkdir(this.configDir, { recursive: true })
      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError('CONFIG_DIR_CREATE_FAILED', 'Failed to create configuration directory', {
          component: 'create-trailhead-cli',
          operation: 'ensureConfigDirectory',
          cause: error,
          details: `Could not create directory ${this.configDir}`,
        })
      )
    }
  }

  /**
   * Ensure preset directory exists
   */
  private async ensurePresetDirectory(): Promise<Result<void, any>> {
    try {
      const { mkdir } = await import('node:fs/promises')
      await mkdir(this.presetDir, { recursive: true })
      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError('PRESET_DIR_CREATE_FAILED', 'Failed to create preset directory', {
          component: 'create-trailhead-cli',
          operation: 'ensurePresetDirectory',
          cause: error,
          details: `Could not create directory ${this.presetDir}`,
        })
      )
    }
  }
}

/**
 * Built-in presets for common project types
 */
export const BUILT_IN_PRESETS: PresetConfig[] = [
  {
    name: 'basic-cli',
    description: 'Basic CLI application with essential features',
    template: 'basic',
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
    initGit: true,
    installDependencies: true,
  },
  {
    name: 'advanced-cli',
    description: 'Full-featured CLI application with all capabilities',
    template: 'advanced',
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
    initGit: true,
    installDependencies: true,
  },
  {
    name: 'library',
    description: 'Reusable library package',
    template: 'basic',
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
    initGit: true,
    installDependencies: true,
  },
  {
    name: 'monorepo-package',
    description: 'Package within a monorepo',
    template: 'basic',
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
    initGit: false,
    installDependencies: false,
  },
]

/**
 * Create a default config manager instance
 */
export function createConfigManager(options?: ConfigManagerOptions): ConfigManager {
  return new ConfigManager(options)
}

// Re-export types for convenience
export type { PresetConfig } from './config-schema.js'
