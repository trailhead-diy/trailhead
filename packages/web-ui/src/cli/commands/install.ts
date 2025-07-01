import { Command } from 'commander'
import chalk from 'chalk'
import type { CLIContext } from '../utils/types.js'
import { runInstallationPrompts } from '../prompts/installation.js'
import { Ok as CliOk, Err as CliErr, type Result } from '@trailhead/cli'
import {
  createValidationPipeline,
  createRule,
  ValidationOk,
  ValidationErr,
} from '@trailhead/cli/core'
import { createNodeFileSystem } from '@trailhead/cli/filesystem'
import { loadConfigSync, logConfigDiscovery, type TrailheadConfig } from '../core/config/index.js'
import {
  performInstallation,
  performDryRunInstallation,
  type InstallOptions as CoreInstallOptions,
} from '../core/installation/index.js'
import { resolveConfiguration } from '../core/installation/config.js'
import { detectFramework, VALID_FRAMEWORKS } from '../core/installation/framework-detection.js'
import { adaptSharedToInstallFS } from '../core/filesystem/adapter.js'
import { createLogger } from '@trailhead/cli/core'
import { convertInstallResult } from './utils/error-conversion.js'
import { getTrailheadPackageRoot } from '../utils/context.js'

interface InstallOptions {
  interactive?: boolean
  framework?: string
  dest?: string
  catalystDir?: string
  force?: boolean
  dryRun?: boolean
  noConfig?: boolean
  overwrite?: boolean
  verbose?: boolean
  wrappers?: boolean
  dependencyStrategy?: string
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Create validation pipeline for install options using framework validation
 */
const createInstallValidation = () => {
  return createValidationPipeline<InstallOptions>()
    .add(
      createRule<InstallOptions>(
        'framework',
        'Framework must be valid if specified',
        (value: unknown) => {
          const options = value as InstallOptions
          
          // Only validate if framework is explicitly provided
          if (options.framework) {
            if (!VALID_FRAMEWORKS.includes(options.framework as any)) {
              return ValidationErr(`Invalid framework. Must be one of: ${VALID_FRAMEWORKS.join(', ')}`, 'framework')
            }
          }

          return ValidationOk(options)
        },
false // Not required, but validated when provided
      )
    )
    .add(
      createRule<InstallOptions>(
        'dest',
        'Destination directory must be valid',
        (value: unknown) => {
          const options = value as InstallOptions
          if (!options.dest) return ValidationOk(options)

          if (typeof options.dest !== 'string' || options.dest.trim().length === 0) {
            return ValidationErr('Destination directory must be a non-empty string', 'dest')
          }

          return ValidationOk(options)
        },
        false
      )
    )
    .add(
      createRule<InstallOptions>(
        'catalystDir',
        'Catalyst directory must be valid',
        (value: unknown) => {
          const options = value as InstallOptions
          if (!options.catalystDir) return ValidationOk(options)

          if (typeof options.catalystDir !== 'string' || options.catalystDir.trim().length === 0) {
            return ValidationErr('Catalyst directory must be a non-empty string', 'catalystDir')
          }

          return ValidationOk(options)
        },
        false
      )
    )
    .add(
      createRule<InstallOptions>(
        'dependencyStrategy',
        'Dependency strategy must be valid',
        (value: unknown) => {
          const options = value as InstallOptions
          if (!options.dependencyStrategy) return ValidationOk(options)

          const validStrategies = ['auto', 'smart', 'selective', 'manual', 'skip', 'force']
          if (!validStrategies.includes(options.dependencyStrategy)) {
            return ValidationErr(`Invalid dependency strategy. Must be one of: ${validStrategies.join(', ')}`, 'dependencyStrategy')
          }

          return ValidationOk(options)
        },
        false
      )
    )
}

// ============================================================================
// INSTALLATION WORKFLOW
// ============================================================================

/**
 * Execute installation workflow using core modules
 */
async function executeInstallation(
  options: InstallOptions,
  context: CLIContext,
  finalOptions?: InstallOptions
): Promise<Result<void>> {
  // Create dependencies
  const nodeFS = createNodeFileSystem()
  const fs = adaptSharedToInstallFS(nodeFS)
  const logger = createLogger(options.verbose ?? false)

  try {
    // Load new config system
    const configResult = loadConfigSync(context.projectRoot)
    let loadedConfig: TrailheadConfig | null = null
    let configPath: string | null = null

    if (configResult.success) {
      loadedConfig = configResult.value.config
      configPath = configResult.value.filepath

      // Always show when config is found
      if (configPath) {
        logger.info(`Found configuration at: ${configPath}`)
      }

      // Log detailed config in verbose mode (check both CLI option and config setting)
      if (loadedConfig && (options.verbose || loadedConfig.verbose)) {
        logConfigDiscovery(configPath, loadedConfig, true)
      }
    }

    // Step 1: Resolve configuration
    logger.step('Resolving configuration...')

    // Merge configuration: CLI options > config file > defaults
    const installConfig = loadedConfig?.install
    const destinationDir = options.dest || installConfig?.destDir

    const resolveResult = await resolveConfiguration(
      fs,
      logger,
      {
        catalystDir: options.catalystDir,
        destinationDir: destinationDir,
        verbose: options.verbose,
      },
      context.projectRoot
    )

    if (!resolveResult.success) {
      return convertInstallResult(resolveResult)
    }

    const config = resolveResult.value

    // Step 2: Detect framework
    logger.step('Detecting framework...')
    const frameworkResult = await detectFramework(
      fs,
      config.projectRoot,
      options.framework as any // Cast since we've validated it
    )

    if (!frameworkResult.success) {
      return convertInstallResult(frameworkResult)
    }

    const framework = frameworkResult.value
    logger.success(`Detected ${framework.framework.name}`)

    // Step 3: Perform installation or dry run
    if (options.dryRun) {
      const dryRunResult = await performDryRunInstallation(
        fs,
        logger,
        config,
        getTrailheadPackageRoot(),
        framework.framework.type,
        options.wrappers ?? true
      )

      if (!dryRunResult.success) {
        return convertInstallResult(dryRunResult)
      }

      logger.info('\nDry run complete. No files were installed.')
      return CliOk(undefined)
    }

    // Build installation options
    const effectiveOptions = finalOptions || options
    const coreOptions: CoreInstallOptions = {
      interactive: effectiveOptions.interactive,
      skipDependencyPrompts: false,
      dependencyStrategy: effectiveOptions.dependencyStrategy as any,
    }

    const installResult = await performInstallation(
      fs,
      logger,
      config,
      getTrailheadPackageRoot(),
      options.force ?? false,
      framework.framework.type,
      options.wrappers ?? true,
      coreOptions
    )

    if (!installResult.success) {
      return convertInstallResult(installResult)
    }

    const summary = installResult.value

    // Step 4: Display summary
    displayInstallationSummary(logger, {
      framework: framework.framework.name,
      filesInstalled: summary.filesInstalled.length,
      themes: ['red', 'rose', 'orange', 'yellow', 'green', 'blue', 'violet', 'catalyst'],
    })

    return CliOk(undefined)
  } catch (error) {
    return CliErr({
      code: 'INSTALL_ERROR',
      message: error instanceof Error ? error.message : 'Installation failed',
      recoverable: false,
      cause: error,
    })
  }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

/**
 * Display installation summary
 */
function displayInstallationSummary(
  logger: import('@trailhead/cli/core').Logger,
  summary: {
    framework: string
    filesInstalled: number
    themes: string[]
  }
): void {
  console.log('')
  console.log(chalk.green('✅ Trailhead UI installed successfully!'))
  console.log('')

  console.log(chalk.bold('📦 Installed:'))
  console.log(`   • ${summary.filesInstalled} files`)
  console.log(`   • ${summary.themes.length} themes available`)
  console.log('')

  console.log(chalk.bold('🚀 Next Steps:'))
  const steps = getFrameworkSteps(summary.framework)
  steps.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step}`)
  })
  console.log('')

  console.log(`📚 Docs: ${chalk.cyan('https://github.com/esteban-url/trailhead-ui#readme')}`)
}

/**
 * Get framework-specific next steps
 */
function getFrameworkSteps(framework: string): string[] {
  switch (framework) {
    case 'RedwoodJS':
      return [
        'Add ThemeProvider to web/src/App.tsx',
        "Import components: import { Button } from '@/components/th/button'",
        'Run: yarn rw dev',
      ]
    case 'Next.js':
      return [
        'Add ThemeProvider to app/layout.tsx or pages/_app.tsx',
        "Import components: import { Button } from '@/components/th/button'",
        'Run: npm run dev',
      ]
    case 'Vite':
      return [
        'Add ThemeProvider to src/main.tsx',
        "Import components: import { Button } from '@/components/th/button'",
        'Run: npm run dev',
      ]
    default:
      return [
        'Wrap your app with ThemeProvider',
        "Import components: import { Button } from '@/components/th/button'",
        'Start your development server',
      ]
  }
}

// ============================================================================
// COMMAND HANDLER
// ============================================================================

/**
 * Handle install command execution
 */
async function handleInstall(options: InstallOptions, context: CLIContext): Promise<void> {
  // Validate options
  const validation = createInstallValidation()
  const validationResult = validation.validateSync(options)

  if (validationResult.overall === 'fail') {
    console.error(chalk.red('❌ Invalid options:'))
    // Simple error display until formatValidationSummary is available
    validationResult.failed.forEach((result) => {
      console.error(`  • ${result.message}`)
    })
    process.exit(1)
  }

  // Show warnings if any
  if (validationResult.overall === 'warning') {
    validationResult.warnings.forEach((result) => {
      console.warn(chalk.yellow(`⚠ ${result.message}`))
    })
  }

  // Run interactive prompts if needed
  let finalOptions = options
  if (options.interactive || (!options.framework && !options.dryRun)) {
    console.log(chalk.blue('🚀 Interactive Installation Mode\n'))
    const promptResults = await runInstallationPrompts()

    // Merge with CLI options (only override if explicitly provided)
    finalOptions = {
      ...promptResults,
      // Only include CLI options that were explicitly set
      ...(options.dest ? { dest: options.dest } : {}),
      ...(options.framework ? { framework: options.framework } : {}),
      ...(options.catalystDir ? { catalystDir: options.catalystDir } : {}),
      ...(options.force !== undefined ? { force: options.force } : {}),
      ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
      ...(options.noConfig !== undefined ? { noConfig: options.noConfig } : {}),
      ...(options.overwrite !== undefined ? { overwrite: options.overwrite } : {}),
      ...(options.interactive !== undefined ? { interactive: options.interactive } : {}),
      ...(options.verbose !== undefined ? { verbose: options.verbose } : {}),
      ...(options.wrappers !== undefined ? { wrappers: options.wrappers } : {}),
    }
  }

  // Execute installation
  const result = await executeInstallation(finalOptions, context, finalOptions)

  if (!result.success) {
    console.error(chalk.red('❌ Installation failed:'))
    console.error(result.error.message)
    if (options.verbose && result.error.details) {
      console.error('Details:', result.error.details)
    }
    process.exit(1)
  }
}

// ============================================================================
// COMMAND CREATION
// ============================================================================

/**
 * Create refactored install command
 */
export const createInstallCommand = (context: CLIContext): Command => {
  return new Command('install')
    .description('Install and configure Trailhead UI components with enhanced theming')
    .option('--catalyst-dir <path>', 'path to catalyst-ui-kit directory')
    .option('-d, --dest <path>', 'destination directory for installation')
    .option('-f, --framework <type>', 'framework type (redwood-sdk, nextjs, vite, generic-react)')
    .option('--force', 'overwrite existing component files')
    .option('--dry-run', 'show what would be done without making changes')
    .option('--no-config', 'skip generating configuration files')
    .option('--overwrite', 'always overwrite config files without prompting')
    .option('-i, --interactive', 'run in interactive mode')
    .option('-v, --verbose', 'show detailed output')
    .option('--no-wrappers', 'install components without wrapper files')
    .option(
      '--dependency-strategy <strategy>',
      'dependency installation strategy (auto, smart, selective, manual, skip, force)'
    )
    .action(async (options: InstallOptions) => {
      await handleInstall(options, context)
    })
    .addHelpText(
      'after',
      `
Examples:
  $ trailhead-ui install
  $ trailhead-ui install --framework nextjs
  $ trailhead-ui install --dest src/ui
  $ trailhead-ui install --dry-run
  $ trailhead-ui install --interactive
`
    )
}
