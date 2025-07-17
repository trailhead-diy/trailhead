import { ok, err, createCoreError } from '@esteban-url/core'
import type { Result } from '@esteban-url/core'
import { input, select, confirm, checkbox } from '@inquirer/prompts'
import type { ProjectConfig, TemplateVariant, PackageManager } from './types.js'
import { createConfigContext } from './config-manager.js'
import { selectPreset, configureWithPreset, createInteractivePreset } from './preset-manager.js'
import { validateModernProjectConfig } from './config-schema.js'
import { resolve } from 'path'

export interface ModernProjectConfig extends ProjectConfig {
  // Enhanced configuration options
  description: string
  author: {
    name: string
    email: string
  }
  license: 'MIT' | 'Apache-2.0' | 'ISC' | 'custom'
  features: {
    core: true // Always required
    config?: boolean
    validation?: boolean
    testing?: boolean
    docs?: boolean
    cicd?: boolean
  }
  projectType: 'standalone-cli' | 'library' | 'monorepo-package'
  nodeVersion: string
  typescript: boolean
  ide: 'vscode' | 'none'
}

/**
 * Interactive project configuration gathering with preset support
 */
export async function gatherProjectConfig(
  projectName?: string,
  flags: Partial<ProjectConfig> = {}
): Promise<Result<ModernProjectConfig, any>> {
  try {
    // Initialize configuration context
    const configContext = createConfigContext({ verbose: flags.verbose })

    // Step 1: Check for preset usage
    const presetResult = await selectPreset(configContext)
    if (presetResult.isErr()) {
      return err(presetResult.error)
    }

    const selectedPreset = presetResult.value
    let baseConfig: Partial<ModernProjectConfig> = { ...flags }

    // If a preset was selected, apply it
    if (selectedPreset) {
      const applyResult = await configureWithPreset(baseConfig, configContext)
      if (applyResult.isErr()) {
        return err(applyResult.error)
      }
      baseConfig = applyResult.value
    }

    // Step 2: Gather project basics
    const name =
      projectName ||
      (await input({
        message: 'Project name:',
        validate: (value: string) => {
          if (!value.trim()) return 'Project name is required'
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'Project name must be lowercase alphanumeric with hyphens only'
          }
          return true
        },
      }))

    const description = await input({
      message: 'Project description:',
      default: baseConfig.description || `A CLI application built with @esteban-url/trailhead-cli`,
    })

    // Author information (skip if already provided by preset)
    const authorName =
      baseConfig.author?.name ||
      (await input({
        message: 'Author name:',
        default: process.env.USER || process.env.USERNAME || '',
      }))

    const authorEmail =
      baseConfig.author?.email ||
      (await input({
        message: 'Author email:',
        validate: (value: string) => {
          if (!value.trim()) return 'Email is required'
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) return 'Please enter a valid email address'
          return true
        },
      }))

    // License selection (skip if provided by preset)
    const license =
      baseConfig.license ||
      (await select({
        message: 'License:',
        choices: [
          { name: 'MIT', value: 'MIT' },
          { name: 'Apache-2.0', value: 'Apache-2.0' },
          { name: 'ISC', value: 'ISC' },
          { name: 'Custom', value: 'custom' },
        ],
        default: 'MIT',
      }))

    // Project type (skip if provided by preset)
    const projectType =
      baseConfig.projectType ||
      (await select({
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

    // Template selection (skip if provided by preset)
    const template: TemplateVariant =
      baseConfig.template ||
      (await select({
        message: 'Template complexity:',
        choices: [
          {
            name: 'Basic',
            value: 'basic',
            description: 'Minimal CLI with essential commands',
          },
          {
            name: 'Advanced',
            value: 'advanced',
            description: 'Full-featured CLI with configuration, validation, and more',
          },
        ],
        default: flags.template || 'basic',
      }))

    // Feature selection (skip if provided by preset)
    let selectedFeatures: string[]
    if (baseConfig.features) {
      // Use preset features, but allow user to modify if they want
      const presetFeatures = Object.entries(baseConfig.features)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name)
        .filter((name) => name !== 'core')

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
              name: 'Input validation',
              value: 'validation',
              checked: presetFeatures.includes('validation'),
            },
            {
              name: 'Testing setup',
              value: 'testing',
              checked: presetFeatures.includes('testing'),
            },
            { name: 'Documentation', value: 'docs', checked: presetFeatures.includes('docs') },
            { name: 'CI/CD workflows', value: 'cicd', checked: presetFeatures.includes('cicd') },
          ],
        })
      }
    } else {
      selectedFeatures = await checkbox({
        message: 'Select features to include:',
        choices: [
          { name: 'Configuration system', value: 'config', checked: template === 'advanced' },
          { name: 'Input validation', value: 'validation', checked: template === 'advanced' },
          { name: 'Testing setup', value: 'testing', checked: true },
          { name: 'Documentation', value: 'docs', checked: flags.includeDocs || false },
          { name: 'CI/CD workflows', value: 'cicd', checked: projectType === 'standalone-cli' },
        ],
      })
    }

    // Package manager
    const packageManager: PackageManager = await select({
      message: 'Package manager:',
      choices: [
        { name: 'pnpm (recommended)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
      ],
      default: flags.packageManager || 'pnpm',
    })

    // Node version
    const nodeVersion = await input({
      message: 'Node.js version target:',
      default: '18',
      validate: (value: string) => {
        const num = parseInt(value)
        if (isNaN(num) || num < 14) return 'Node.js version must be 14 or higher'
        return true
      },
    })

    // Development preferences
    const setupVscode = await confirm({
      message: 'Configure VS Code settings?',
      default: true,
    })

    const initGit =
      flags.initGit !== undefined
        ? flags.initGit
        : await confirm({
            message: 'Initialize Git repository?',
            default: true,
          })

    const installDependencies =
      flags.installDependencies !== undefined
        ? flags.installDependencies
        : await confirm({
            message: 'Install dependencies after generation?',
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

    const config: ModernProjectConfig = {
      projectName: name,
      projectPath: resolve(name),
      description,
      template,
      packageManager,
      includeDocs: features.docs,
      initGit,
      installDependencies,
      dryRun: flags.dryRun || false,
      force: flags.force || false,
      verbose: flags.verbose || false,

      // Enhanced configuration
      author: {
        name: authorName,
        email: authorEmail,
      },
      license: license as any,
      features,
      projectType: projectType as any,
      nodeVersion,
      typescript: true, // Always TypeScript for trailhead-cli projects
      ide: setupVscode ? 'vscode' : 'none',
    }

    // Validate the final configuration
    const validationResult = validateModernProjectConfig(config)
    if (validationResult.isErr()) {
      return validationResult
    }

    // Offer to save configuration as preset
    if (selectedPreset === null) {
      // Only if no preset was used
      const saveAsPreset = await confirm({
        message: 'Save this configuration as a preset for future use?',
        default: false,
      })

      if (saveAsPreset) {
        const presetResult = await createInteractivePreset(config, configContext)
        if (presetResult.isErr()) {
          console.warn('Failed to save preset, but continuing with project generation')
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
          if (i + 1 >= args.length) {
            return err(
              createCoreError('INVALID_ARGS', 'CLI_ERROR', '--template requires a value', {
                component: 'create-trailhead-cli',
                operation: 'parseArguments',
              })
            )
          }
          const template = args[i + 1]
          if (template !== 'basic' && template !== 'advanced') {
            return err(
              createCoreError(
                'INVALID_TEMPLATE',
                'CLI_ERROR',
                'Template must be "basic" or "advanced"',
                {
                  component: 'create-trailhead-cli',
                  operation: 'parseArguments',
                }
              )
            )
          }
          flags.template = template
          interactive = false // Non-interactive if template specified
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

        case '--no-git':
          flags.initGit = false
          break

        case '--no-install':
          flags.installDependencies = false
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
              })
            )
          }
          return err(
            createCoreError('UNEXPECTED_ARG', 'CLI_ERROR', `Unexpected argument: ${arg}`, {
              component: 'create-trailhead-cli',
              operation: 'parseArguments',
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
      createCoreError('PARSE_FAILED', 'CLI_ERROR', 'Failed to parse command line arguments', {
        component: 'create-trailhead-cli',
        operation: 'parseArguments',
        cause: error,
        recoverable: false,
      })
    )
  }
}
