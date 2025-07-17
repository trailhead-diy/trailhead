import { ok, err, createCoreError } from '@esteban-url/core'
import type { Result, CoreError } from '@esteban-url/core'
import { select, confirm, input } from '@inquirer/prompts'
import {
  BUILT_IN_PRESETS,
  type PresetConfig,
  type ConfigContext,
  listPresets,
  loadPreset,
} from './config-manager.js'
import type { ModernProjectConfig } from './interactive-prompts.js'
import { getRecommendedModules } from './modular-templates.js'

// ========================================
// Functional Preset Management API
// ========================================

/**
 * Interactive preset selection
 *
 * @param context - Configuration context
 * @returns Result with selected preset or null if none selected
 */
export async function selectPreset(
  context: ConfigContext
): Promise<Result<PresetConfig | null, CoreError>> {
  try {
    // Get available presets (built-in + custom)
    const availablePresetsResult = await listPresets(context)
    if (availablePresetsResult.isErr()) {
      return err(availablePresetsResult.error)
    }

    const presetNames = availablePresetsResult.value

    if (presetNames.length === 0) {
      console.log('No presets available. Using default configuration.')
      return ok(null)
    }

    // Ask if user wants to use a preset
    const usePreset = await confirm({
      message: 'Would you like to use a configuration preset?',
      default: true,
    })

    if (!usePreset) {
      return ok(null)
    }

    // Load preset details for display
    const presetDetails: PresetConfig[] = []
    for (const name of presetNames) {
      const presetResult = await loadPreset(name, context)
      if (presetResult.isOk()) {
        presetDetails.push(presetResult.value)
      }
    }

    // Show preset options
    const choices = presetDetails.map((preset: PresetConfig) => ({
      name: `${preset.name} - ${preset.description}`,
      value: preset.name,
    }))

    const selectedPresetName = await select({
      message: 'Select a configuration preset:',
      choices,
    })

    // Load and return the selected preset
    const selectedPresetResult = await loadPreset(selectedPresetName, context)
    if (selectedPresetResult.isErr()) {
      return err(selectedPresetResult.error)
    }

    return ok(selectedPresetResult.value)
  } catch (error) {
    return err(
      createCoreError('PRESET_SELECTION_ERROR', 'CLI_ERROR', 'Failed to select preset', {
        component: 'PresetManager',
        operation: 'selectPreset',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * Interactive configuration of project with preset
 *
 * @param baseConfig - Base project configuration
 * @param context - Configuration context
 * @returns Result with configured project or error
 */
export async function configureWithPreset(
  baseConfig: Partial<ModernProjectConfig>,
  context: ConfigContext
): Promise<Result<ModernProjectConfig, CoreError>> {
  try {
    // Select preset
    const presetResult = await selectPreset(context)
    if (presetResult.isErr()) {
      return err(presetResult.error)
    }

    const selectedPreset = presetResult.value

    if (!selectedPreset) {
      // No preset selected, return base config as-is
      return ok(baseConfig as ModernProjectConfig)
    }

    // Show preset details
    console.log(`\\nUsing preset: ${selectedPreset.name}`)
    console.log(`Description: ${selectedPreset.description}`)
    console.log(`Template: ${selectedPreset.template}`)

    const enabledFeatures = Object.entries(selectedPreset.features || {})
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)

    if (enabledFeatures.length > 0) {
      console.log(`Features: ${enabledFeatures.join(', ')}`)
    }

    // Ask for confirmation
    const confirmPreset = await confirm({
      message: 'Use this preset configuration?',
      default: true,
    })

    if (!confirmPreset) {
      // Try again or use base config
      const retry = await confirm({
        message: 'Select a different preset?',
        default: false,
      })

      if (retry) {
        return configureWithPreset(baseConfig, context)
      } else {
        return ok(baseConfig as ModernProjectConfig)
      }
    }

    // Apply preset to base config (excluding preset-only fields)
    const { name: _name, ...presetWithoutName } = selectedPreset
    const mergedConfig: ModernProjectConfig = {
      ...baseConfig,
      ...presetWithoutName,
      // Preserve project-specific values from base config
      projectName: baseConfig.projectName || '',
      projectPath: baseConfig.projectPath || '',
      description: baseConfig.description || selectedPreset.description || '',
      author: baseConfig.author || { name: '', email: '' },
      license: baseConfig.license || 'MIT',
      nodeVersion: baseConfig.nodeVersion || selectedPreset.nodeVersion || '18',
      typescript: baseConfig.typescript ?? true,
      ide: baseConfig.ide || selectedPreset.ide || 'vscode',
      projectType: baseConfig.projectType || selectedPreset.projectType || 'standalone-cli',
      template: baseConfig.template || selectedPreset.template || 'basic',
      packageManager: baseConfig.packageManager || selectedPreset.packageManager || 'pnpm',
      includeDocs: baseConfig.includeDocs ?? selectedPreset.includeDocs ?? false,
      initGit: baseConfig.initGit ?? selectedPreset.initGit ?? true,
      installDependencies:
        baseConfig.installDependencies ?? selectedPreset.installDependencies ?? true,
      dryRun: baseConfig.dryRun ?? false,
      force: baseConfig.force ?? false,
      verbose: baseConfig.verbose ?? false,
      // Ensure core feature is always enabled
      features: {
        ...presetWithoutName.features,
        ...baseConfig.features,
        core: true,
      },
    }

    return ok(mergedConfig)
  } catch (error) {
    return err(
      createCoreError(
        'PRESET_CONFIGURATION_ERROR',
        'CLI_ERROR',
        'Failed to configure with preset',
        {
          component: 'PresetManager',
          operation: 'configureWithPreset',
          cause: error,
          recoverable: false,
        }
      )
    )
  }
}

/**
 * Interactive preset creation
 *
 * @param baseConfig - Base configuration to create preset from
 * @param context - Configuration context
 * @returns Result with created preset or error
 */
export async function createInteractivePreset(
  baseConfig: ModernProjectConfig,
  _context: ConfigContext
): Promise<Result<PresetConfig, CoreError>> {
  try {
    console.log('\\nCreating a new preset from current configuration...')

    // Get preset details
    const presetName = await input({
      message: 'Preset name:',
      validate: (value: string) => {
        if (!value.trim()) return 'Preset name is required'
        if (!/^[a-z0-9-_]+$/.test(value)) {
          return 'Preset name must contain only lowercase letters, numbers, hyphens, and underscores'
        }
        return true
      },
    })

    const description = await input({
      message: 'Preset description:',
      validate: (value: string) => (value.trim() ? true : 'Description is required'),
    })

    // Create preset from base config
    const preset: PresetConfig = {
      name: presetName.trim(),
      description: description.trim(),
      template: baseConfig.template,
      projectType: baseConfig.projectType,
      features: baseConfig.features,
      packageManager: baseConfig.packageManager,
      nodeVersion: baseConfig.nodeVersion,
      ide: baseConfig.ide,
      includeDocs: baseConfig.includeDocs,
      initGit: baseConfig.initGit,
      installDependencies: baseConfig.installDependencies,
    }

    // Show preview
    console.log('\\nPreset preview:')
    console.log(`Name: ${preset.name}`)
    console.log(`Description: ${preset.description}`)
    console.log(`Template: ${preset.template}`)
    console.log(`Project Type: ${preset.projectType}`)

    const enabledFeatures = Object.entries(preset.features || {})
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)

    if (enabledFeatures.length > 0) {
      console.log(`Features: ${enabledFeatures.join(', ')}`)
    }

    // Confirm creation
    const confirmCreate = await confirm({
      message: 'Create this preset?',
      default: true,
    })

    if (!confirmCreate) {
      return err(
        createCoreError(
          'PRESET_CREATION_CANCELLED',
          'CLI_ERROR',
          'Preset creation cancelled by user',
          {
            component: 'PresetManager',
            operation: 'createInteractivePreset',
            recoverable: true,
          }
        )
      )
    }

    return ok(preset)
  } catch (error) {
    return err(
      createCoreError('PRESET_CREATION_ERROR', 'CLI_ERROR', 'Failed to create interactive preset', {
        component: 'PresetManager',
        operation: 'createInteractivePreset',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * List presets with detailed information
 *
 * @param context - Configuration context
 * @returns Result with detailed preset list or error
 */
export async function listPresetsDetailed(
  context: ConfigContext
): Promise<Result<void, CoreError>> {
  try {
    const presetNamesResult = await listPresets(context)
    if (presetNamesResult.isErr()) {
      return err(presetNamesResult.error)
    }

    const presetNames = presetNamesResult.value

    if (presetNames.length === 0) {
      console.log('No presets available.')
      return ok(undefined)
    }

    console.log('\\nAvailable presets:\\n')

    for (const name of presetNames) {
      const presetResult = await loadPreset(name, context)
      if (presetResult.isOk()) {
        const preset = presetResult.value
        const isBuiltIn = BUILT_IN_PRESETS.some((p) => p.name === preset.name)

        console.log(`📋 ${preset.name}${isBuiltIn ? ' (built-in)' : ' (custom)'}`)
        console.log(`   ${preset.description}`)
        console.log(`   Template: ${preset.template}`)
        console.log(`   Project Type: ${preset.projectType}`)

        const enabledFeatures = Object.entries(preset.features || {})
          .filter(([, enabled]) => enabled)
          .map(([name]) => name)

        if (enabledFeatures.length > 0) {
          console.log(`   Features: ${enabledFeatures.join(', ')}`)
        }

        if (preset.packageManager) {
          console.log(`   Package Manager: ${preset.packageManager}`)
        }

        if (preset.nodeVersion) {
          console.log(`   Node.js: ${preset.nodeVersion}`)
        }

        console.log('') // Empty line for spacing
      }
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'PRESET_LIST_DETAILED_ERROR',
        'CLI_ERROR',
        'Failed to list detailed presets',
        {
          component: 'PresetManager',
          operation: 'listPresetsDetailed',
          cause: error,
          recoverable: false,
        }
      )
    )
  }
}

/**
 * Get recommended modules for a preset
 *
 * @param preset - Preset configuration
 * @returns Array of recommended module names
 */
export function getRecommendedModulesForPreset(preset: PresetConfig): string[] {
  const modules: string[] = ['core'] // Always include core

  // Add modules based on features
  if (preset.features?.testing) {
    modules.push('testing')
  }

  if (preset.features?.docs) {
    modules.push('docs')
  }

  if (preset.features?.config) {
    modules.push('config')
  }

  if (preset.features?.validation) {
    modules.push('validation')
  }

  if (preset.features?.cicd) {
    modules.push('cicd')
  }

  // Add modules based on project type
  if (preset.projectType === 'library') {
    modules.push('validation', 'docs')
  }

  // Get additional recommended modules
  const recommended = getRecommendedModules(preset.template, preset.projectType)
  for (const module of recommended) {
    if (!modules.includes(module)) {
      modules.push(module)
    }
  }

  return modules
}
