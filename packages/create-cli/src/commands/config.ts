#!/usr/bin/env node

import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { createDefaultLogger } from '@esteban-url/cli/utils'
import { createCommand, type CommandOptions, type CommandContext } from '@esteban-url/cli/command'
import {
  createConfigContext,
  generateSchemaFile,
  cleanupOldConfigs,
  loadPreset,
} from '../lib/config/manager.js'
import { listPresetsDetailed } from '../lib/config/presets.js'

/**
 * Configuration options for the config command
 */
interface ConfigOptions extends CommandOptions {
  /** List all available presets */
  readonly listPresets?: boolean
  /** Generate JSON schema for IDE support */
  readonly generateSchema?: boolean
  /** Show details of a specific preset */
  readonly preset?: string
  /** Clean up old configuration files */
  readonly cleanup?: boolean
  /** Use custom configuration directory */
  readonly configDir?: string
}

/**
 * Configuration management command for create-trailhead-cli
 */
export const configCommand = createCommand<ConfigOptions>({
  name: 'config',
  description: 'Manage configuration files and presets',
  options: [
    {
      flags: '--list-presets',
      description: 'List all available presets with details',
      type: 'boolean',
    },
    {
      flags: '--generate-schema',
      description: 'Generate JSON schema for IDE support',
      type: 'boolean',
    },
    {
      flags: '--preset <name>',
      description: 'Show details of a specific preset',
      type: 'string',
    },
    {
      flags: '--cleanup',
      description: 'Clean up old configuration files',
      type: 'boolean',
    },
    {
      flags: '--config-dir <path>',
      description: 'Use custom configuration directory',
      type: 'string',
    },
  ],
  examples: [
    'config --list-presets',
    'config --preset advanced-cli',
    'config --generate-schema',
    'config --cleanup',
  ],
  action: async (
    options: ConfigOptions,
    context: CommandContext
  ): Promise<Result<void, CoreError>> => {
    try {
      const configContext = createConfigContext({
        configDir: options.configDir,
        verbose: options.verbose,
      })

      // List presets
      if (options.listPresets) {
        return await handleListPresets(configContext)
      }

      // Generate JSON schema
      if (options.generateSchema) {
        return await handleGenerateSchema(configContext)
      }

      // Load specific preset
      if (options.preset) {
        return await handleLoadPreset(configContext, options.preset)
      }

      // Clean up old configs
      if (options.cleanup) {
        return await handleCleanup(configContext)
      }

      // Show help if no specific action
      context.logger.info(`
create-trailhead-cli config - Configuration and preset management

Usage:
  create-trailhead-cli config [options]

Options:
  --list-presets          List all available presets with details
  --generate-schema       Generate JSON schema for IDE support
  --preset <name>         Show details of a specific preset
  --cleanup               Clean up old configuration files
  --config-dir <path>     Use custom configuration directory
  --verbose               Enable verbose output

Examples:
  create-trailhead-cli config --list-presets
  create-trailhead-cli config --preset advanced-cli
  create-trailhead-cli config --generate-schema
  create-trailhead-cli config --cleanup

Configuration Files:
  Config directory: ${configContext.configDir}
  Preset directory: ${configContext.presetDir}
`)

      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError('CONFIG_COMMAND_ERROR', 'CLI_ERROR', 'Configuration command failed', {
          component: 'create-trailhead-cli',
          operation: 'configCommand',
          cause: error,
          recoverable: false,
        })
      )
    }
  },
})

/**
 * Handle listing presets
 */
async function handleListPresets(configContext: any): Promise<Result<void, CoreError>> {
  const logger = createDefaultLogger()
  logger.info('📋 Listing available presets...')
  logger.info('')

  const listResult = await listPresetsDetailed(configContext)
  if (listResult.isErr()) {
    logger.error(`Failed to list presets: ${listResult.error.message}`)
    return listResult
  }

  return ok(undefined)
}

/**
 * Handle generating JSON schema
 */
async function handleGenerateSchema(configContext: any): Promise<Result<void, CoreError>> {
  const logger = createDefaultLogger()
  logger.info('📄 Generating JSON schema...')

  const schemaResult = await generateSchemaFile(configContext)
  if (schemaResult.isErr()) {
    logger.error(`Failed to generate schema: ${schemaResult.error.message}`)
    return err(schemaResult.error)
  }

  logger.success(`JSON schema generated: ${schemaResult.value}`)
  logger.info('This schema file can be used for IDE autocompletion and validation.')

  return ok(undefined)
}

/**
 * Handle loading specific preset
 */
async function handleLoadPreset(
  configContext: any,
  presetName: string
): Promise<Result<void, CoreError>> {
  const logger = createDefaultLogger()
  logger.info(`📋 Loading preset: ${presetName}`)

  const presetResult = await loadPreset(presetName, configContext)
  if (presetResult.isErr()) {
    logger.error(`Failed to load preset '${presetName}': ${presetResult.error.message}`)
    return err(presetResult.error)
  }

  const preset = presetResult.value

  logger.info('')
  logger.success(`Preset: ${preset.name}`)
  logger.info(`   Description: ${preset.description}`)
  logger.info(`   Project type: ${preset.projectType}`)

  const enabledFeatures = Object.entries(preset.features || {})
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)

  if (enabledFeatures.length > 0) {
    logger.info(`   Features: ${enabledFeatures.join(', ')}`)
  }

  if (preset.packageManager) {
    logger.info(`   Package manager: ${preset.packageManager}`)
  }

  if (preset.nodeVersion) {
    logger.info(`   Node.js version: ${preset.nodeVersion}`)
  }

  if (preset.ide) {
    logger.info(`   IDE: ${preset.ide}`)
  }

  logger.info(`   Include docs: ${preset.includeDocs ?? 'default'}`)

  return ok(undefined)
}

/**
 * Handle cleanup
 */
async function handleCleanup(configContext: any): Promise<Result<void, CoreError>> {
  const logger = createDefaultLogger()
  logger.info('🧹 Cleaning up old configuration files...')

  const cleanupResult = await cleanupOldConfigs(30, configContext) // 30 days
  if (cleanupResult.isErr()) {
    logger.error(`Failed to cleanup: ${cleanupResult.error.message}`)
    return err(cleanupResult.error)
  }

  const cleanedCount = cleanupResult.value
  logger.success(`Cleaned up ${cleanedCount} old configuration file(s)`)

  return ok(undefined)
}
