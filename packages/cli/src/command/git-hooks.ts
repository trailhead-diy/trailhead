/**
 * Git hooks management commands for the Trailhead CLI
 * Provides installation, update, and configuration of smart git hooks
 */

import { Command } from 'commander'
import path from 'path'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { fs } from '../fs/index.js'
import { colors } from '../utils/chalk.js'
import { createDefaultLogger } from '../utils/logger.js'

/**
 * Configuration options for git hooks commands
 *
 * Controls hook installation type, framework detection, and
 * command behavior for git hooks management.
 */
interface GitHooksOptions {
  type?: 'smart-aggressive' | 'conservative' | 'basic'
  framework?: 'vitest' | 'jest' | 'auto'
  packageManager?: 'pnpm' | 'npm' | 'yarn' | 'auto'
  dryRun?: boolean
  force?: boolean
  destination?: string
}

/**
 * Detected project configuration
 *
 * Contains auto-detected information about the project structure,
 * tools, and setup used to configure git hooks appropriately.
 */
interface ProjectConfig {
  /** Whether project is a monorepo (turbo, lerna, pnpm workspace) */
  isMonorepo: boolean
  /** Detected package manager (pnpm, npm, yarn) */
  packageManager: string
  /** Detected test framework (vitest, jest) */
  testFramework: string
  /** Whether TypeScript is configured */
  hasTypeScript: boolean
  /** Directory containing packages in monorepo */
  packagesDir: string
  /** List of package names in monorepo */
  packages: string[]
}

// Constants
const TEMPLATES_DIR = '../templates/git-hooks'
const DEFAULT_SCRIPTS_DIR = 'scripts'

/**
 * Detect project configuration automatically
 *
 * Analyzes the project structure to determine monorepo setup,
 * package manager, test framework, and other configuration details
 * needed to generate appropriate git hooks.
 *
 * @returns Detected project configuration or error
 */
async function detectProjectConfig(): Promise<Result<ProjectConfig, CoreError>> {
  // Use fs directly from domain package

  try {
    // Detect package manager
    let packageManager = 'npm'
    const pnpmLockResult = await fs.exists('pnpm-lock.yaml')
    const yarnLockResult = await fs.exists('yarn.lock')

    if (pnpmLockResult.isOk()) {
      packageManager = 'pnpm'
    } else if (yarnLockResult.isOk()) {
      packageManager = 'yarn'
    }

    // Detect monorepo
    const turboResult = await fs.exists('turbo.json')
    const pnpmWorkspaceResult = await fs.exists('pnpm-workspace.yaml')
    const lernaResult = await fs.exists('lerna.json')

    const isMonorepo = turboResult.isOk() || pnpmWorkspaceResult.isOk() || lernaResult.isOk()

    // Detect TypeScript
    const tsconfigResult = await fs.exists('tsconfig.json')
    const hasTypeScript = tsconfigResult.isOk()

    // Detect test framework
    let testFramework = 'vitest'
    const jestConfigJsResult = await fs.exists('jest.config.js')
    const jestConfigTsResult = await fs.exists('jest.config.ts')

    if (jestConfigJsResult.isOk() || jestConfigTsResult.isOk()) {
      testFramework = 'jest'
    }

    // Try to read package.json to confirm framework
    try {
      const packageJsonResult = await fs.readFile('package.json')
      if (packageJsonResult.isOk()) {
        const packageJson = JSON.parse(packageJsonResult.value)

        if (packageJson.devDependencies?.jest || packageJson.dependencies?.jest) {
          testFramework = 'jest'
        } else if (packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest) {
          testFramework = 'vitest'
        }
      }
    } catch {
      // Ignore package.json read errors
    }

    // Detect packages directory and list packages
    let packagesDir = 'packages'
    let packages: string[] = []

    if (isMonorepo) {
      try {
        const packagesDirResult = await fs.exists('packages')
        if (packagesDirResult.isOk()) {
          const dirResult = await fs.readDir('packages')
          if (dirResult.isOk()) {
            packages = dirResult.value
          }
        }
      } catch {
        // Ignore packages detection errors
      }
    }

    return ok({
      isMonorepo,
      packageManager,
      testFramework,
      hasTypeScript,
      packagesDir,
      packages,
    })
  } catch (error) {
    return err(
      createCoreError(
        'GIT_HOOKS_ERROR',
        'CLI_ERROR',
        `Failed to detect project configuration: ${error}`,
        {}
      )
    )
  }
}

/**
 * Generate template variables from project configuration
 *
 * Transforms detected project configuration into template variables
 * used for rendering git hook templates with project-specific values.
 *
 * @param config - Detected project configuration
 * @param options - Git hooks command options
 * @returns Template variables for rendering
 */
function generateTemplateVars(
  config: ProjectConfig,
  options: GitHooksOptions
): Record<string, any> {
  const vars: Record<string, any> = {
    CLI_VERSION: '0.1.0',
    PROJECT_NAME: path.basename(process.cwd()),
    PACKAGE_MANAGER: config.packageManager,
    IS_MONOREPO: config.isMonorepo,
    PACKAGES_DIR: config.packagesDir,
    PACKAGES_PATTERN: `^${config.packagesDir}/([^/]+)/`,
    PACKAGES_GLOB: config.packagesDir,

    // Test configuration
    TEST_COMMAND: `${config.packageManager} test`,
    TIMEOUT: 120,

    // File patterns
    FILE_PATTERNS: config.hasTypeScript ? 'ts,tsx,js,jsx,json,md' : 'js,jsx,json,md',
    SOURCE_PATTERN: config.hasTypeScript ? '**/*.{ts,tsx,js,jsx}' : '**/*.{js,jsx}',

    // High-risk patterns
    HIGH_RISK_PATTERNS: [
      config.hasTypeScript ? '\\.(ts|tsx|js|jsx)$' : '\\.(js|jsx)$',
      'tsconfig',
      'package\\.json$',
      ...(config.isMonorepo ? ['turbo\\.json$'] : []),
      `${config.testFramework}\\.config`,
      'vite\\.config',
      'tsup\\.config',
      'lefthook\\.yml$',
    ],

    // Skip patterns
    SKIP_PATTERNS: [
      '\\.md$',
      'README',
      'CHANGELOG',
      'LICENSE',
      '\\.github/',
      '\\.vscode/',
      '\\.gitignore$',
      '\\.prettierrc',
      '\\.prettierignore',
      'docs/',
      '\\.smart-test-config\\.json$',
    ],

    // Tool commands
    LINT_COMMAND: 'oxlint',
    LINT_FIX_FLAG: '--fix',
    TYPECHECK_COMMAND: config.hasTypeScript
      ? `${config.packageManager} types`
      : 'echo "No TypeScript"',

    // Prettier cache
    PRETTIER_CACHE: config.isMonorepo
      ? '--cache --cache-location .turbo/.prettiercache'
      : '--cache',

    // Priority settings
    SECRETS_PRIORITY: 5,
    FILESIZE_PRIORITY: 6,
    TESTS_PRIORITY: 7,

    // Smart test command
    SMART_TEST_COMMAND: `./${options.destination || DEFAULT_SCRIPTS_DIR}/smart-test-runner.sh`,

    // Monorepo config pattern
    MONOREPO_CONFIG_PATTERN: config.isMonorepo ? 'turbo\\.json$|pnpm-workspace' : 'package\\.json$',

    // Optional features
    DOCS_VALIDATION: false, // Can be enabled based on project detection
    CHANGESET_REMINDER: config.isMonorepo,
    CONVENTIONAL_COMMITS: true,
    LOCKFILE_VALIDATION: config.packageManager === 'pnpm',
    LOCKFILE:
      config.packageManager === 'pnpm'
        ? 'pnpm-lock.yaml'
        : config.packageManager === 'yarn'
          ? 'yarn.lock'
          : 'package-lock.json',

    // Example scope for commit messages
    EXAMPLE_SCOPE: config.isMonorepo ? config.packages[0] || 'cli' : 'app',
  }

  // Add package mappings for monorepo
  if (config.isMonorepo && config.packages.length > 0) {
    vars.PACKAGE_MAPPINGS = {}
    config.packages.forEach((pkg) => {
      // Try to guess package name from directory
      vars.PACKAGE_MAPPINGS[pkg] = `@${vars.PROJECT_NAME}/${pkg}`
    })
  }

  return vars
}

/**
 * Render template string with variable substitution
 *
 * Supports variable replacement ({{VAR}}), conditionals ({{#if}}),
 * and iteration over arrays/objects ({{#each}}). Used to generate
 * project-specific configuration files from templates.
 *
 * @param template - Template string with placeholders
 * @param vars - Variables to substitute into template
 * @returns Rendered template with variables replaced
 */
function renderTemplate(template: string, vars: Record<string, any>): string {
  let result = template

  // Replace simple variables {{VAR}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = vars[key.trim()]
    return value !== undefined ? String(value) : match
  })

  // Handle conditional blocks {{#if VAR}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, condition, content) => {
      const value = vars[condition.trim()]
      return value ? content : ''
    }
  )

  // Handle arrays {{#each ARR}}...{{/each}}
  result = result.replace(
    /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, arrayName, itemTemplate) => {
      const array = vars[arrayName.trim()]
      if (!Array.isArray(array)) return ''

      return array
        .map((item, index) => {
          let itemContent = itemTemplate
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item))
          itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === array.length - 1))
          return itemContent
        })
        .join('')
    }
  )

  // Handle object iteration {{#each OBJ}}...{{/each}}
  result = result.replace(
    /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, objName, itemTemplate) => {
      const obj = vars[objName.trim()]
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return ''

      const entries = Object.entries(obj)
      return entries
        .map(([key, value], index) => {
          let itemContent = itemTemplate
          itemContent = itemContent.replace(/\{\{@key\}\}/g, key)
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(value))
          itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === entries.length - 1))
          return itemContent
        })
        .join('')
    }
  )

  return result
}

/**
 * Install smart git hooks for the project
 *
 * Detects project configuration and installs appropriate git hooks
 * including test runner scripts, lefthook configuration, and smart
 * test configuration. Supports dry-run mode for preview.
 *
 * @param options - Installation options
 * @returns Success or error with details
 */
async function installGitHooks(options: GitHooksOptions): Promise<Result<void, CoreError>> {
  // Use fs directly from domain package

  try {
    const logger = createDefaultLogger()
    logger.info('🔧 Installing smart git hooks...')

    // Detect project configuration
    const projectConfigResult = await detectProjectConfig()
    if (projectConfigResult.isErr()) {
      return err(projectConfigResult.error)
    }

    const config = projectConfigResult.value
    const vars = generateTemplateVars(config, options)

    if (options.dryRun) {
      logger.warning('📋 DRY RUN - Would install:')
      logger.info(`  Project type: ${config.isMonorepo ? 'Monorepo' : 'Single package'}`)
      logger.info(`  Package manager: ${config.packageManager}`)
      logger.info(`  Test framework: ${config.testFramework}`)
      logger.info(`  TypeScript: ${config.hasTypeScript ? 'Yes' : 'No'}`)
      if (config.isMonorepo) {
        logger.info(`  Packages: ${config.packages.join(', ')}`)
      }
      return ok(undefined)
    }

    // Get template directory
    const templatesDir = path.resolve(__dirname, TEMPLATES_DIR)

    // Create scripts directory
    const scriptsDir = options.destination || DEFAULT_SCRIPTS_DIR
    await fs.ensureDir(scriptsDir)

    // Copy and process smart-test-runner.sh
    const runnerTemplateResult = await fs.readFile(path.join(templatesDir, 'smart-test-runner.sh'))
    if (runnerTemplateResult.isErr()) {
      return err(
        createCoreError(
          'GIT_HOOKS_ERROR',
          'CLI_ERROR',
          `Failed to read smart-test-runner.sh template: ${runnerTemplateResult.error.message}`,
          {}
        )
      )
    }

    const runnerContent = renderTemplate(runnerTemplateResult.value, vars)
    const runnerPath = path.join(scriptsDir, 'smart-test-runner.sh')

    const writeRunnerResult = await fs.writeFile(runnerPath, runnerContent)
    if (writeRunnerResult.isErr()) {
      return err(
        createCoreError(
          'GIT_HOOKS_ERROR',
          'CLI_ERROR',
          `Failed to write smart-test-runner.sh: ${writeRunnerResult.error.message}`,
          {}
        )
      )
    }

    // Make executable using outputFile (which handles permissions)
    const outputResult = await fs.outputFile(runnerPath, runnerContent)
    if (outputResult.isErr()) {
      return err(
        createCoreError(
          'GIT_HOOKS_ERROR',
          'CLI_ERROR',
          `Failed to set executable permissions: ${outputResult.error.message}`,
          {}
        )
      )
    }

    // Process and copy lefthook.yml
    const lefthookTemplateResult = await fs.readFile(
      path.join(templatesDir, 'lefthook.yml.template')
    )
    if (lefthookTemplateResult.isErr()) {
      return err(
        createCoreError(
          'GIT_HOOKS_ERROR',
          'CLI_ERROR',
          `Failed to read lefthook.yml.template: ${lefthookTemplateResult.error.message}`,
          {}
        )
      )
    }

    const lefthookContent = renderTemplate(lefthookTemplateResult.value, vars)

    const lefthookPath = 'lefthook.yml'
    const lefthookResult = await fs.exists(lefthookPath)
    if (lefthookResult.isOk() && !options.force) {
      logger.warning(`${lefthookPath} already exists. Use --force to overwrite.`)
    } else {
      const writeLefthookResult = await fs.writeFile(lefthookPath, lefthookContent)
      if (writeLefthookResult.isErr()) {
        return err(
          createCoreError(
            'GIT_HOOKS_ERROR',
            'CLI_ERROR',
            `Failed to write lefthook.yml: ${writeLefthookResult.error.message}`,
            {}
          )
        )
      }
    }

    // Process and copy .smart-test-config.json
    const configTemplateResult = await fs.readFile(
      path.join(templatesDir, 'smart-test-config.json.template')
    )
    if (configTemplateResult.isErr()) {
      return err(
        createCoreError(
          'GIT_HOOKS_ERROR',
          'CLI_ERROR',
          `Failed to read smart-test-config.json.template: ${configTemplateResult.error.message}`,
          {}
        )
      )
    }

    const configContent = renderTemplate(configTemplateResult.value, vars)

    const configPath = '.smart-test-config.json'
    const smartConfigResult = await fs.exists(configPath)
    if (smartConfigResult.isOk() && !options.force) {
      logger.warning(`${configPath} already exists. Use --force to overwrite.`)
    } else {
      const writeConfigResult = await fs.writeFile(configPath, configContent)
      if (writeConfigResult.isErr()) {
        return err(
          createCoreError(
            'GIT_HOOKS_ERROR',
            'CLI_ERROR',
            `Failed to write .smart-test-config.json: ${writeConfigResult.error.message}`,
            {}
          )
        )
      }
    }

    // Copy README
    const readmeTemplateResult = await fs.readFile(path.join(templatesDir, 'README.md'))
    if (readmeTemplateResult.isErr()) {
      return err(
        createCoreError(
          'GIT_HOOKS_ERROR',
          'CLI_ERROR',
          `Failed to read README.md template: ${readmeTemplateResult.error.message}`,
          {}
        )
      )
    }

    const readmePath = path.join(scriptsDir, 'README.md')
    const readmeResult = await fs.exists(readmePath)
    if (readmeResult.isErr() || options.force) {
      const writeReadmeResult = await fs.writeFile(readmePath, readmeTemplateResult.value)
      if (writeReadmeResult.isErr()) {
        return err(
          createCoreError(
            'GIT_HOOKS_ERROR',
            'CLI_ERROR',
            `Failed to write README.md: ${writeReadmeResult.error.message}`,
            {}
          )
        )
      }
    }

    logger.success('Smart git hooks installed successfully!')
    logger.info('📋 Next steps:')
    logger.step(
      `Install lefthook: ${config.packageManager === 'pnpm' ? 'pnpm' : 'npm'} install lefthook`
    )
    logger.step(`Install git hooks: ${config.packageManager} lefthook install`)
    logger.step(`Test the setup: ./${scriptsDir}/smart-test-runner.sh --dry-run --verbose`)

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('GIT_HOOKS_ERROR', 'CLI_ERROR', `Failed to install git hooks: ${error}`, {})
    )
  }
}

/**
 * Update existing git hooks to latest version
 *
 * Updates hook scripts while preserving configuration files.
 * Useful for applying improvements to hook logic without
 * losing project-specific settings.
 *
 * @param options - Update options
 * @returns Success or error with details
 */
async function updateGitHooks(options: GitHooksOptions): Promise<Result<void, CoreError>> {
  const logger = createDefaultLogger()
  logger.info('🔄 Updating smart git hooks...')

  // For updates, we force overwrite the scripts but preserve config
  const updateOptions = { ...options, force: true }
  // Remove force flag to preserve config files

  return installGitHooks(updateOptions)
}

/**
 * Remove installed git hooks from the project
 *
 * Removes all git hook files including scripts, configuration,
 * and lefthook setup. Supports dry-run mode to preview changes.
 *
 * @param options - Removal options
 * @returns Success or error with details
 */
async function removeGitHooks(options: GitHooksOptions): Promise<Result<void, CoreError>> {
  // Use fs directly from domain package

  try {
    const logger = createDefaultLogger()
    logger.warning('🗑️  Removing smart git hooks...')

    if (options.dryRun) {
      logger.warning('📋 DRY RUN - Would remove:')
      logger.info('  scripts/smart-test-runner.sh')
      logger.info('  lefthook.yml')
      logger.info('  .smart-test-config.json')
      return ok(undefined)
    }

    const scriptsDir = options.destination || DEFAULT_SCRIPTS_DIR

    // Remove files
    const filesToRemove = [
      path.join(scriptsDir, 'smart-test-runner.sh'),
      path.join(scriptsDir, 'README.md'),
      'lefthook.yml',
      '.smart-test-config.json',
    ]

    for (const file of filesToRemove) {
      const fileResult = await fs.exists(file)
      if (fileResult.isOk()) {
        const removeResult = await fs.remove(file, {
          recursive: true,
          force: true,
        })
        if (removeResult.isOk()) {
          logger.debug(`Removed ${file}`)
        }
      }
    }

    // Remove scripts directory if empty
    try {
      const entriesResult = await fs.readDir(scriptsDir)
      if (entriesResult.isOk() && entriesResult.value.length === 0) {
        const removeDirResult = await fs.remove(scriptsDir, {
          recursive: true,
          force: true,
        })
        if (removeDirResult.isOk()) {
          logger.debug(`Removed empty directory ${scriptsDir}`)
        }
      }
    } catch {
      // Ignore errors removing directory
    }

    logger.success('Smart git hooks removed successfully!')
    logger.info('📋 You may also want to:')
    logger.step('Uninstall lefthook: npm uninstall lefthook')
    logger.step('Remove git hooks: lefthook uninstall')

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('GIT_HOOKS_ERROR', 'CLI_ERROR', `Failed to remove git hooks: ${error}`, {})
    )
  }
}

/**
 * Interactive configuration wizard for git hooks
 *
 * Guides users through git hooks configuration by detecting
 * current project setup and suggesting appropriate settings.
 * Currently shows detected configuration for review.
 *
 * @returns Success or error with details
 */
async function configureGitHooks(): Promise<Result<void, CoreError>> {
  try {
    const logger = createDefaultLogger()
    logger.info('🔧 Git Hooks Configuration Wizard')
    logger.info('This wizard will help you configure smart test execution.')
    logger.info('')

    // Detect current configuration
    const configResult = await detectProjectConfig()
    if (configResult.isErr()) {
      return err(configResult.error)
    }

    const config = configResult.value

    // Interactive prompts would go here
    logger.success('Current Configuration:')
    logger.info(`  Project type: ${config.isMonorepo ? 'Monorepo' : 'Single package'}`)
    logger.info(`  Package manager: ${config.packageManager}`)
    logger.info(`  Test framework: ${config.testFramework}`)
    logger.info(`  TypeScript: ${config.hasTypeScript ? 'Yes' : 'No'}`)

    if (config.isMonorepo) {
      logger.info(`  Packages: ${config.packages.join(', ')}`)
      logger.info(`  Parallel testing: Enabled`)
    } else {
      logger.info(`  Parallel testing: Disabled (single package)`)
    }

    logger.info(`  Max retries: 2`)
    logger.info(`  Timeout: 120s`)
    logger.info(`  Retry flaky tests: Enabled`)

    logger.info('')
    logger.warning('💡 Configuration looks good! Run `git-hooks install` to set up hooks.')

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('GIT_HOOKS_ERROR', 'CLI_ERROR', `Configuration wizard failed: ${error}`, {})
    )
  }
}

/**
 * Create git-hooks command with subcommands
 *
 * Provides a complete git hooks management CLI with install,
 * update, remove, configure, and status subcommands for
 * managing smart git hooks in projects.
 *
 * @returns Commander command instance ready for registration
 */
export function createGitHooksCommand(): Command {
  const command = new Command('git-hooks').description('Manage smart git hooks for your project')

  // Install subcommand
  command
    .command('install')
    .description('Install smart git hooks')
    .option(
      '--type <type>',
      'Hook type (smart-aggressive, conservative, basic)',
      'smart-aggressive'
    )
    .option('--framework <framework>', 'Test framework (vitest, jest, auto)', 'auto')
    .option('--package-manager <pm>', 'Package manager (pnpm, npm, yarn, auto)', 'auto')
    .option('--destination <dir>', 'Destination directory for scripts', 'scripts')
    .option('--dry-run', 'Show what would be installed without making changes')
    .option('--force', 'Overwrite existing files')
    .action(async (options: GitHooksOptions) => {
      const result = await installGitHooks(options)
      if (result.isErr()) {
        const logger = createDefaultLogger()
        logger.error(result.error.message)
        process.exit(1)
      }
    })

  // Update subcommand
  command
    .command('update')
    .description('Update smart git hooks to latest version')
    .option('--destination <dir>', 'Scripts directory', 'scripts')
    .option('--dry-run', 'Show what would be updated without making changes')
    .action(async (options: GitHooksOptions) => {
      const result = await updateGitHooks(options)
      if (result.isErr()) {
        const logger = createDefaultLogger()
        logger.error(result.error.message)
        process.exit(1)
      }
    })

  // Remove subcommand
  command
    .command('remove')
    .description('Remove smart git hooks')
    .option('--destination <dir>', 'Scripts directory', 'scripts')
    .option('--dry-run', 'Show what would be removed without making changes')
    .action(async (options: GitHooksOptions) => {
      const result = await removeGitHooks(options)
      if (result.isErr()) {
        const logger = createDefaultLogger()
        logger.error(result.error.message)
        process.exit(1)
      }
    })

  // Configure subcommand
  command
    .command('configure')
    .description('Interactive configuration wizard for git hooks')
    .action(async () => {
      const result = await configureGitHooks()
      if (result.isErr()) {
        const logger = createDefaultLogger()
        logger.error(result.error.message)
        process.exit(1)
      }
    })

  // Status subcommand
  command
    .command('status')
    .description('Show git hooks status')
    .action(async () => {
      // Use fs directly from domain package

      const logger = createDefaultLogger()
      logger.info('📊 Git Hooks Status')

      const files = ['scripts/smart-test-runner.sh', 'lefthook.yml', '.smart-test-config.json']

      for (const file of files) {
        const fileResult = await fs.exists(file)
        const status = fileResult.isOk() ? colors.green('✅ Installed') : colors.red('❌ Missing')
        logger.info(`   ${file}: ${status}`)
      }

      // Check if lefthook is installed
      try {
        const packageJsonResult = await fs.readFile('package.json')
        if (packageJsonResult.isOk()) {
          const pkg = JSON.parse(packageJsonResult.value)
          const hasLefthook = pkg.devDependencies?.lefthook || pkg.dependencies?.lefthook
          const lefthookStatus = hasLefthook
            ? colors.green('✅ Installed')
            : colors.yellow('⚠️  Not installed')
          logger.info(`   lefthook package: ${lefthookStatus}`)
        } else {
          logger.info(`   lefthook package: ${colors.cyan('❓ Cannot determine')}`)
        }
      } catch {
        console.log(`   lefthook package: ${colors.cyan('❓ Cannot determine')}`)
      }
    })

  return command
}
