import { ok, err, createCoreError, type Result } from '@trailhead/core'
import { input, select, confirm, checkbox } from '@trailhead/cli/prompts'
import { consola } from 'consola'
import type { ProjectConfig, PackageManager } from '../config/types.js'
import { createConfigContext } from '../config/manager.js'
import { selectPreset, configureWithPreset, createInteractivePreset } from '../config/presets.js'
import { validateProjectConfig } from '../config/schema.js'
import { resolve } from 'path'

/**
 * Interactive project configuration gathering with preset support
 */
export async function gatherProjectConfig(
  projectName?: string,
  flags: Partial<ProjectConfig & { 'non-interactive'?: boolean }> = {}
): Promise<Result<ProjectConfig, any>> {
  try {
    // Initialize configuration context
    const configContext = createConfigContext({ verbose: flags.verbose })

    // Skip preset selection in non-interactive mode
    let selectedPreset = null
    let baseConfig: Partial<ProjectConfig> = { ...flags }

    if (!flags['non-interactive']) {
      // Step 1: Check for preset usage (only in interactive mode)
      const presetResult = await selectPreset(configContext)
      if (presetResult.isErr()) {
        return err(presetResult.error)
      }

      selectedPreset = presetResult.value

      // If a preset was selected, apply it
      if (selectedPreset) {
        const applyResult = await configureWithPreset(baseConfig, configContext)
        if (applyResult.isErr()) {
          return err(applyResult.error)
        }
        baseConfig = applyResult.value
      }
    }

    // Step 2: Gather project basics
    const name = projectName || 'my-cli' // Default name in non-interactive mode

    // Project type (skip if provided by preset or in non-interactive mode)
    const projectType =
      baseConfig.projectType ||
      (flags['non-interactive']
        ? 'standalone-cli'
        : await select({
            message: 'Project type:',
            choices: [
              {
                name: 'Standalone CLI Application',
                value: 'standalone-cli',
                description: 'Complete CLI application with all features',
              },
              {
                name: 'Library/Package',
                value: 'library',
                description: 'Reusable library or package',
              },
              {
                name: 'Monorepo Package',
                value: 'monorepo-package',
                description: 'Package within an existing monorepo',
              },
            ],
            default: 'standalone-cli',
          }))

    // Feature selection (skip if provided by preset or in non-interactive mode)
    let selectedFeatures: string[]
    if (baseConfig.features) {
      // Use preset features, but allow user to modify if they want
      const presetFeatures = Object.entries(baseConfig.features)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name)
        .filter((name) => name !== 'core')

      if (flags['non-interactive']) {
        selectedFeatures = presetFeatures
      } else {
        const keepPresetFeatures = await confirm({
          message: `Keep preset features (${presetFeatures.join(', ')})?`,
          default: true,
        })

        if (keepPresetFeatures) {
          selectedFeatures = presetFeatures
        } else {
          selectedFeatures = await checkbox({
            message: 'Select features to include:',
            choices: [
              {
                name: 'Configuration system',
                value: 'config',
                checked: presetFeatures.includes('config'),
              },
              {
                name: 'Testing setup',
                value: 'testing',
                checked: presetFeatures.includes('testing'),
              },
            ],
          })
        }
      }
    } else {
      // Default feature selection for non-interactive mode
      if (flags['non-interactive']) {
        selectedFeatures = ['config', 'testing'] // Modern CLI essentials
      } else {
        selectedFeatures = await checkbox({
          message: 'Select features to include:',
          choices: [
            { name: 'Configuration system', value: 'config', checked: true },
            { name: 'Testing setup', value: 'testing', checked: true },
          ],
        })
      }
    }

    // Package manager
    const packageManager: PackageManager =
      flags.packageManager ||
      (flags['non-interactive']
        ? 'pnpm'
        : await select({
            message: 'Package manager:',
            choices: [
              { name: 'pnpm (recommended)', value: 'pnpm' },
              { name: 'npm', value: 'npm' },
            ],
            default: 'pnpm',
          }))

    // Node version
    const nodeVersion = flags['non-interactive']
      ? '18'
      : await input({
          message: 'Node.js version target:',
          default: '18',
          validate: (value: string) => {
            const num = parseInt(value)
            if (isNaN(num) || num < 14) return 'Node.js version must be 14 or higher'
            return true
          },
        })

    // Development preferences
    const setupVscode = flags['non-interactive']
      ? false
      : await confirm({
          message: 'Configure VS Code settings?',
          default: true,
        })

    // Build configuration
    const features = {
      core: true as const,
      config: selectedFeatures.includes('config'),
      validation: selectedFeatures.includes('validation'),
      testing: selectedFeatures.includes('testing'),
      docs: selectedFeatures.includes('docs'),
      cicd: selectedFeatures.includes('cicd'),
    }

    const config: ProjectConfig = {
      projectName: name,
      projectPath: resolve(name),
      packageManager,
      includeDocs: features.docs,
      dryRun: flags.dryRun || false,
      force: flags.force || false,
      verbose: flags.verbose || false,
      features,
      projectType: projectType as any,
      nodeVersion,
      typescript: true, // Always TypeScript for trailhead-cli projects
      ide: setupVscode ? 'vscode' : 'none',
    }

    // Validate the final configuration
    const validationResult = validateProjectConfig(config)
    if (validationResult.isErr()) {
      return validationResult
    }

    // Offer to save configuration as preset (skip in non-interactive mode)
    if (selectedPreset === null && !flags['non-interactive']) {
      // Only if no preset was used and in interactive mode
      const saveAsPreset = await confirm({
        message: 'Save this configuration as a preset for future use?',
        default: false,
      })

      if (saveAsPreset) {
        const presetResult = await createInteractivePreset(config, configContext)
        if (presetResult.isErr()) {
          consola.warn('Failed to save preset, but continuing with project generation')
        }
      }
    }

    return ok(validationResult.value)
  } catch (error) {
    return err(
      createCoreError('PROMPT_FAILED', 'CLI_ERROR', 'Failed to gather project configuration', {
        component: 'create-trailhead-cli',
        operation: 'gatherProjectConfig',
        cause: error,
        recoverable: false,
        severity: 'high',
      })
    )
  }
}

/**
 * Parse command line arguments and determine if interactive mode is needed
 */
export function parseArgumentsModern(args: string[]): Result<
  {
    projectName?: string
    flags: Partial<ProjectConfig>
    interactive: boolean
    help: boolean
    version: boolean
  },
  any
> {
  try {
    const flags: Partial<ProjectConfig> = {}
    let projectName: string | undefined
    let interactive = true
    let help = false
    let version = false

    let i = 0

    // Parse project name (first positional argument)
    if (args.length > 0 && !args[0].startsWith('-')) {
      projectName = args[0]
      i = 1
    }

    // Parse flags
    while (i < args.length) {
      const arg = args[i]

      switch (arg) {
        case '-h':
        case '--help':
          help = true
          interactive = false
          break

        case '-v':
        case '--version':
          version = true
          interactive = false
          break

        case '-t':
        case '--template':
          // Template is deprecated, skip the value
          i++ // Skip the value
          break

        case '-p':
        case '--package-manager':
          if (i + 1 >= args.length) {
            return err(
              createCoreError('INVALID_ARGS', 'CLI_ERROR', '--package-manager requires a value', {
                component: 'create-trailhead-cli',
                operation: 'parseArguments',
              })
            )
          }
          const pm = args[i + 1]
          if (pm !== 'npm' && pm !== 'pnpm') {
            return err(
              createCoreError(
                'INVALID_PACKAGE_MANAGER',
                'CLI_ERROR',
                'Package manager must be "npm" or "pnpm"',
                {
                  component: 'create-trailhead-cli',
                  operation: 'parseArguments',
                }
              )
            )
          }
          flags.packageManager = pm
          i++ // Skip the value
          break

        case '--docs':
          flags.includeDocs = true
          break

        case '--no-install':
          // Deprecated: installation is no longer automatic
          break

        case '--force':
          flags.force = true
          break

        case '--dry-run':
          flags.dryRun = true
          break

        case '--verbose':
          flags.verbose = true
          break

        case '--non-interactive':
          interactive = false
          break

        default:
          if (arg.startsWith('-')) {
            return err(
              createCoreError('UNKNOWN_OPTION', 'CLI_ERROR', `Unknown option: ${arg}`, {
                component: 'create-trailhead-cli',
                operation: 'parseArguments',
                suggestion: 'Use --help for available options',
              })
            )
          }
          // Additional positional arguments are not supported
          return err(
            createCoreError('UNEXPECTED_ARGUMENT', 'CLI_ERROR', `Unexpected argument: ${arg}`, {
              component: 'create-trailhead-cli',
              operation: 'parseArguments',
              suggestion: 'Only one project name is supported',
            })
          )
      }

      i++
    }

    return ok({
      projectName,
      flags,
      interactive,
      help,
      version,
    })
  } catch (error) {
    return err(
      createCoreError('PARSE_ERROR', 'CLI_ERROR', 'Failed to parse arguments', {
        component: 'create-trailhead-cli',
        operation: 'parseArgumentsModern',
        cause: error,
        recoverable: false,
      })
    )
  }
}
