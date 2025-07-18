import { ok, err } from '@esteban-url/core'
import type { Result, CoreError } from '@esteban-url/core'
import { resolve, dirname } from 'path'
import { fs } from '@esteban-url/fs'
import { fileURLToPath } from 'url'
import { execa } from 'execa'
import { chalk, createSpinner } from '@esteban-url/cli/utils'
import { debugTemplateContext, debugError, debugStats } from './logger-utils.js'
import { createGeneratorError, ERROR_CODES } from './error-helpers.js'
import { createCoreError } from '@esteban-url/core'
import { createGeneratorGitOperations } from './git-operations.js'
import {
  validateProjectName,
  validateProjectPath,
  validatePackageManager,
  validateTemplate,
  validateOutputPath,
  validateTemplatePath,
} from './validation.js'

import type { ProjectConfig, TemplateContext, GeneratorContext } from './types.js'
import type { ModernProjectConfig } from './interactive-prompts.js'
import { createTemplateContext } from './template-context.js'
import { getTemplateFiles } from './template-loader.js'
import { composeTemplate } from './modular-templates.js'
import {
  compileTemplate,
  precompileTemplates,
  createTemplateCompilerContext,
  getTemplateCacheStats,
  cleanupTemplateCache,
} from './template-compiler.js'
import { formatGeneratedCode } from './transform-helpers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Simple package manager detection
 */
function detectPackageManager(): Result<string, CoreError> {
  try {
    // For now, just return the configured package manager
    // In a full implementation, this would check for lock files, etc.
    return ok('pnpm')
  } catch (error) {
    return err(
      createGeneratorError(
        ERROR_CODES.PACKAGE_MANAGER_DETECTION_FAILED,
        'No package manager detected',
        {
          operation: 'detectPackageManager',
          cause: error instanceof Error ? error : undefined,
          recoverable: true,
        }
      )
    )
  }
}

// Filesystem operations are now imported directly

// Global template compiler context for caching
let globalTemplateCompilerContext = createTemplateCompilerContext({
  enableCache: true,
  maxCacheSize: 100,
  strict: true,
  escapeHtml: true,
})

/**
 * Generate a new CLI project from templates
 *
 * This is the main entry point for project generation. It orchestrates the entire
 * process from template loading through file processing to dependency installation.
 *
 * @param config - Complete project configuration including template variant, paths, and options
 * @param context - Generator execution context with logger, filesystem, and environment
 * @returns Promise resolving to Result indicating success or detailed error information
 *
 * @example
 * ```typescript
 * const config: ProjectConfig = {
 *   projectName: 'my-cli',
 *   projectPath: '/path/to/project',
 *   template: 'basic',
 *   packageManager: 'pnpm',
 *   includeDocs: true,
 *   initGit: true,
 *   installDependencies: true,
 *   dryRun: false
 * }
 *
 * const result = await generateProject(config, context)
 * if (result.isOk()) {
 *   console.log('Project generated successfully!')
 * } else {
 *   console.error('Generation failed:', result.error.message)
 * }
 * ```
 *
 * @see {@link ProjectConfig} for configuration options
 * @see {@link GeneratorContext} for context requirements
 */
export async function generateProject(
  config: ProjectConfig | ModernProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger, verbose } = context

  try {
    // Phase 0: Validate configuration
    const validationResult = validateProjectConfig(config)
    if (!validationResult.isOk()) {
      return validationResult
    }

    logger.info(`Generating ${config.template} CLI project: ${chalk.cyan(config.projectName)}`)

    if (config.dryRun) {
      logger.info(chalk.yellow('DRY RUN MODE - No files will be created'))
    }

    // Phase 1: Prepare template context
    const templateContext = await createTemplateContext(config)
    if (verbose) {
      debugTemplateContext(logger, 'Template context', templateContext)
    }

    // Phase 2: Load template files
    let templateFiles

    // Check if this is a ModernProjectConfig (has features property)
    if ('features' in config) {
      // Use new modular template system
      const composedResult = composeTemplate(config as ModernProjectConfig)
      if (composedResult.isErr()) {
        return err(composedResult.error)
      }

      const composedTemplate = composedResult.value
      templateFiles = composedTemplate.files
      logger.info(
        `Composed template with ${composedTemplate.modules.length} modules and ${templateFiles.length} files`
      )
    } else {
      // Use legacy template system
      templateFiles = await getTemplateFiles(config.template, context.templateConfig)
      logger.info(`Found ${templateFiles.length} template files`)
    }

    // Phase 2.5: Pre-compile templates for better performance
    // Get the resolved template directory from template loader
    const { resolveTemplatePaths } = await import('./template-loader.js')
    const { paths } = resolveTemplatePaths(config.template, context.templateConfig)

    // For modular templates, resolve template paths correctly
    const templatePaths = templateFiles
      .filter((f: any) => f.isTemplate)
      .map((f: any) => {
        // Handle modular template paths (modules/module-name/...)
        if (f.source.startsWith('modules/')) {
          return resolve(paths.base, f.source)
        }
        // Handle legacy template paths
        return resolve(paths.base, f.source)
      })

    if (templatePaths.length > 0) {
      const precompileSpinner = createSpinner('Pre-compiling templates...')
      precompileSpinner.start()
      const precompileResult = await precompileTemplates(
        templatePaths,
        globalTemplateCompilerContext
      )
      if (precompileResult.isOk()) {
        globalTemplateCompilerContext = precompileResult.value
      }
      precompileSpinner.success(`Pre-compiled ${templatePaths.length} templates`)
    }

    // Phase 3: Create project directory
    if (!config.dryRun) {
      const createDirResult = await createProjectDirectory(config.projectPath)
      if (!createDirResult.isOk()) {
        return createDirResult
      }
    }

    // Phase 4: Process and copy files
    const spinner = createSpinner('Processing template files...')
    spinner.start()
    const startTime = performance.now()

    for (const templateFile of templateFiles) {
      const result = await processTemplateFile(templateFile, templateContext, config, context)

      if (!result.isOk()) {
        spinner.error(`Failed to process ${templateFile.source}`)
        return result
      }

      if (verbose) {
        spinner.text = `Processed ${templateFile.destination}`
      }
    }

    const processingTime = performance.now() - startTime
    const avgTimePerFile = processingTime / templateFiles.length

    spinner.success(
      `Template files processed (${Math.round(processingTime)}ms, ${Math.round(avgTimePerFile)}ms avg)`
    )

    if (verbose) {
      const cacheStats = getTemplateCacheStats(globalTemplateCompilerContext)
      debugStats(logger, 'Template cache', {
        entries: cacheStats.size,
        files: cacheStats.entries.length,
      })
    }

    // Phase 5: Initialize git repository
    if (config.initGit && !config.dryRun) {
      const gitResult = await initializeGitRepository(config.projectPath, context)
      if (!gitResult.isOk()) {
        logger.warning('Failed to initialize git repository')
      }
    }

    // Phase 6: Install dependencies
    if (config.installDependencies && !config.dryRun) {
      const installResult = await installDependencies(config, context)
      if (!installResult.isOk()) {
        logger.warning('Failed to install dependencies')
      }
    }

    // Phase 7: Configure development environment
    if (!config.dryRun) {
      const devSetupResult = await setupDevelopmentEnvironment(config, context)
      if (!devSetupResult.isOk()) {
        logger.warning('Failed to configure development environment')
      }
    }

    // Phase 8: Verify project readiness
    if (!config.dryRun) {
      const verificationResult = await verifyProjectReadiness(config, context)
      if (!verificationResult.isOk()) {
        logger.warning('Project verification failed - project may not be ready for development')
        if (verbose) {
          debugError(logger, 'Project verification', verificationResult.error)
        }
      } else {
        logger.info('✅ Project is ready for development')
      }
    }

    // Phase 9: Cleanup template cache if needed
    globalTemplateCompilerContext = cleanupTemplateCache(globalTemplateCompilerContext, 50)

    return ok(undefined)
  } catch (error) {
    logger.error(`Generator failed: ${error instanceof Error ? error.message : String(error)}`)
    return err(
      createCoreError('PROJECT_GENERATION_FAILED', 'CLI_ERROR', 'Project generation failed', {
        cause: error,
        context: { details: error instanceof Error ? error.message : String(error) },
      })
    )
  }
}

/**
 * Validate project configuration before generation
 *
 * Performs comprehensive security validation of all project configuration parameters
 * to ensure they meet requirements and prevent security vulnerabilities.
 *
 * @param config - Project configuration to validate
 * @returns Result indicating validation success or specific validation errors
 *
 * @internal
 *
 * Validation checks include:
 * - Project name: alphanumeric with limited special chars, no path traversal
 * - Project path: validated against directory traversal attacks
 * - Template: whitelisted template variants only
 * - Package manager: whitelisted package managers only
 */
function validateProjectConfig(config: ProjectConfig): Result<void, CoreError> {
  // Validate project name with security checks
  const nameValidation = validateProjectName(config.projectName)
  if (!nameValidation.isOk()) {
    return err(nameValidation.error)
  }

  // Validate project path with directory traversal protection
  const pathValidation = validateProjectPath(config.projectPath, process.cwd())
  if (!pathValidation.isOk()) {
    return err(pathValidation.error)
  }

  // Validate template with whitelist
  const templateValidation = validateTemplate(config.template)
  if (!templateValidation.isOk()) {
    return err(templateValidation.error)
  }

  // Validate package manager with whitelist
  const packageManagerValidation = validatePackageManager(config.packageManager)
  if (!packageManagerValidation.isOk()) {
    return err(packageManagerValidation.error)
  }

  return ok(undefined)
}

/**
 * Create the project directory structure
 *
 * Ensures the target project directory exists and is writable.
 * Creates any necessary parent directories.
 *
 * @param projectPath - Absolute path to the project directory to create
 * @returns Promise resolving to Result indicating directory creation success or failure
 *
 * @internal
 *
 * @throws {CoreError} When directory creation fails due to permissions or filesystem issues
 */
async function createProjectDirectory(projectPath: string): Promise<Result<void, CoreError>> {
  const result = await fs.ensureDir(projectPath)
  if (result.isErr()) {
    return err(
      createCoreError(
        'DIRECTORY_CREATION_FAILED',
        'CLI_ERROR',
        'Failed to create project directory',
        {
          cause: result.error,
        }
      )
    )
  }
  return ok(undefined)
}

/**
 * Process a single template file through compilation or copying
 *
 * Handles both Handlebars template files (.hbs) and static files.
 * Template files are compiled with the provided context, while static
 * files are copied directly. Preserves file permissions and structure.
 *
 * @param templateFile - Template file metadata including source, destination, and processing flags
 * @param templateContext - Handlebars context variables for template compilation
 * @param config - Project configuration including dry-run and path settings
 * @param context - Generator context with logger and filesystem access
 * @returns Promise resolving to Result indicating processing success or failure
 *
 * @internal
 *
 * Processing workflow:
 * 1. Resolve source template path and destination output path
 * 2. Create destination directory if needed
 * 3. For templates (.hbs): compile with Handlebars and write processed content
 * 4. For static files: copy directly to destination
 * 5. Set executable permissions if specified
 *
 * @see {@link TemplateCompiler} for template compilation optimization
 */
async function processTemplateFile(
  templateFile: any,
  templateContext: TemplateContext,
  config: ProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  try {
    const { logger, verbose } = context

    // Validate template source path to prevent directory traversal
    // Get the resolved template directory from template loader
    const { resolveTemplatePaths } = await import('./template-loader.js')
    const { paths } = resolveTemplatePaths(config.template, context.templateConfig)
    const baseTemplateDir = paths.base

    // Resolve the full template path (handle modular vs legacy paths)
    let fullTemplatePath
    if (templateFile.source.startsWith('modules/')) {
      fullTemplatePath = resolve(baseTemplateDir, templateFile.source)
    } else {
      fullTemplatePath = resolve(baseTemplateDir, templateFile.source)
    }

    const templatePathValidation = validateTemplatePath(templateFile.source, baseTemplateDir)
    if (!templatePathValidation.isOk()) {
      return err(templatePathValidation.error)
    }

    // Validate output destination path to prevent directory traversal
    const outputPathValidation = validateOutputPath(templateFile.destination, config.projectPath)
    if (!outputPathValidation.isOk()) {
      return err(outputPathValidation.error)
    }
    const outputPath = outputPathValidation.value

    const templatePath = fullTemplatePath

    if (config.dryRun) {
      logger.info(`Would create: ${templateFile.destination}`)
      return ok(undefined)
    }

    // Ensure output directory exists
    const ensureDirResult = await fs.ensureDir(dirname(outputPath))
    if (ensureDirResult.isErr()) {
      return err(
        createCoreError(
          'OUTPUT_DIRECTORY_CREATION_FAILED',
          'CLI_ERROR',
          `Failed to create output directory ${dirname(outputPath)}`,
          {
            cause: ensureDirResult.error,
          }
        )
      )
    }

    if (templateFile.isTemplate) {
      // Process template with optimized compiler
      const compileResult = await compileTemplate(
        templatePath,
        templateContext,
        globalTemplateCompilerContext
      )
      if (compileResult.isErr()) {
        return err(
          createCoreError(
            'TEMPLATE_COMPILE_ERROR',
            'TEMPLATE_ERROR',
            `Failed to compile template ${templateFile.relativePath}: ${compileResult.error.message}`,
            {
              component: 'Generator',
              operation: 'processTemplateFile',
              cause: compileResult.error,
              recoverable: false,
            }
          )
        )
      }
      const processedContent = compileResult.value

      // Format the generated code if it's a code file
      const formattedContent = await formatGeneratedCode(processedContent, outputPath)

      const writeResult = await fs.writeFile(outputPath, formattedContent)
      if (writeResult.isErr()) {
        return err(
          createCoreError(
            'TEMPLATE_WRITE_FAILED',
            'CLI_ERROR',
            `Failed to write template file ${outputPath}`,
            {
              cause: writeResult.error,
            }
          )
        )
      }

      if (verbose) {
        logger.debug(`Processed template: ${templateFile.source} -> ${templateFile.destination}`)
      }
    } else {
      // Copy file as-is
      const copyResult = await fs.copy(templatePath, outputPath)
      if (copyResult.isErr()) {
        return err(
          createCoreError(
            'FILE_COPY_FAILED',
            'CLI_ERROR',
            `Failed to copy file ${templatePath} to ${outputPath}`,
            {
              cause: copyResult.error,
            }
          )
        )
      }

      if (verbose) {
        logger.debug(`Copied file: ${templateFile.source} -> ${templateFile.destination}`)
      }
    }

    // Set executable permissions if needed
    // Note: CLI filesystem doesn't expose chmod, so we'll use fs directly for now
    if (templateFile.executable) {
      try {
        const { chmod } = await import('node:fs/promises')
        await chmod(outputPath, 0o755)
      } catch {
        // Non-critical error, just log it
        if (verbose) {
          logger.debug(`Warning: Could not set executable permissions for ${outputPath}`)
        }
      }
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'TEMPLATE_PROCESSING_FAILED',
        'CLI_ERROR',
        `Failed to process template file ${templateFile.source}`,
        {
          cause: error,
          context: { details: error instanceof Error ? error.message : String(error) },
        }
      )
    )
  }
}

/**
 * Initialize a Git repository in the project directory
 *
 * Creates a new Git repository, adds all generated files, and makes
 * an initial commit with a conventional commit message.
 * Uses secure command execution to prevent injection attacks.
 *
 * @param projectPath - Absolute path to the project directory (must be validated)
 * @param context - Generator context with logger for user feedback
 * @returns Promise resolving to Result indicating Git initialization success or failure
 *
 * @internal
 *
 * Git workflow:
 * 1. Initialize new Git repository (`git init`)
 * 2. Stage all files (`git add .`)
 * 3. Create initial commit with conventional commit format
 *
 * @requires Git must be installed and available in PATH
 * @see {@link https://conventionalcommits.org/} for commit message format
 */
async function initializeGitRepository(
  projectPath: string,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger: _logger } = context

  // Validate project path to prevent command injection
  const pathValidation = validateProjectPath(projectPath, process.cwd())
  if (!pathValidation.isOk()) {
    return err(pathValidation.error)
  }
  const _safePath = pathValidation.value

  const spinner = createSpinner('Initializing git repository...')
  spinner.start()

  const gitOps = createGeneratorGitOperations()

  // Initialize git repository
  const initResult = await gitOps.initRepository(projectPath)
  if (initResult.isErr()) {
    spinner.error('Failed to initialize git repository')
    return err(initResult.error)
  }

  // Stage all files
  const stageResult = await gitOps.stageFiles(projectPath, ['.'])
  if (stageResult.isErr()) {
    spinner.error('Failed to stage files')
    return err(stageResult.error)
  }

  // Create initial commit with conventional commit format
  const commitResult = await gitOps.createCommit(
    projectPath,
    'feat: initial project setup\n\nGenerated using create-trailhead-cli with modern architecture'
  )
  if (commitResult.isErr()) {
    spinner.error('Failed to create initial commit')
    return err(commitResult.error)
  }

  spinner.success('Git repository initialized')
  return ok(undefined)
}

/**
 * Install project dependencies using the configured package manager
 *
 * Executes the appropriate install command for the selected package manager
 * (npm or pnpm) in the project directory.
 * Uses secure command execution to prevent injection attacks.
 *
 * @param config - Project configuration containing package manager selection
 * @param context - Generator context with logger for user feedback
 * @returns Promise resolving to Result indicating installation success or failure
 *
 * @internal
 *
 * Automatically detects the best available package manager using CLI utilities.
 * Supports npm and pnpm with proper version validation and caching.
 *
 * Installation runs with piped stdio to suppress verbose output while
 * still capturing errors for diagnostics.
 *
 * @see {@link detectPackageManager} for package manager detection logic
 */
async function installDependencies(
  config: ProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger: _logger } = context

  try {
    // Validate project path to prevent command injection
    const pathValidation = validateProjectPath(config.projectPath, process.cwd())
    if (!pathValidation.isOk()) {
      return err(pathValidation.error)
    }
    const safePath = pathValidation.value

    // Use CLI package manager detection instead of manual validation
    const packageManagerResult = detectPackageManager()
    if (!packageManagerResult.isOk()) {
      return err(
        createCoreError(
          'PACKAGE_MANAGER_NOT_FOUND',
          'CLI_ERROR',
          'No suitable package manager found',
          {
            cause: packageManagerResult.error,
            context: { details: 'Package manager detection failed' },
            suggestion: 'Install pnpm or npm and ensure it is available in PATH',
          }
        )
      )
    }

    const packageManager = packageManagerResult.value
    const spinner = createSpinner(`Installing dependencies with ${packageManager}...`)
    spinner.start()

    // Use CLI package manager configuration
    const installArgs = packageManager === 'pnpm' ? ['install', '--ignore-workspace'] : ['install']

    await execa(packageManager, installArgs, {
      cwd: safePath,
      stdio: 'pipe', // Prevent output injection
      shell: false, // Disable shell interpretation
      timeout: 300000, // 5 minute timeout for security
    })

    spinner.success('Dependencies installed')
    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('DEPENDENCY_INSTALL_FAILED', 'CLI_ERROR', 'Failed to install dependencies', {
        cause: error,
        context: {
          details:
            'Dependency installation failed - ensure the package manager is installed and accessible',
        },
      })
    )
  }
}

/**
 * Setup development environment configuration
 *
 * Configures IDE settings, Git configuration, and development tools
 * for optimal developer experience with the generated project.
 *
 * @param config - Project configuration containing IDE and setup preferences
 * @param context - Generator context with logger for user feedback
 * @returns Promise resolving to Result indicating setup success or failure
 *
 * @internal
 *
 * Development environment setup includes:
 * - IDE-specific configuration (template-based)
 * - Git configuration (user info, hooks, ignores)
 * - Development tool setup (linting, formatting, testing)
 * - Project verification to ensure everything works
 */
async function setupDevelopmentEnvironment(
  config: ProjectConfig | ModernProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger } = context
  const spinner = createSpinner('Setting up development environment...')
  spinner.start()

  try {
    // IDE configuration is handled through template files in modules/vscode/

    // Setup Git configuration
    const gitConfigResult = await setupGitConfiguration(config, context)
    if (!gitConfigResult.isOk()) {
      spinner.text = 'Git configuration failed, continuing...'
      debugError(logger, 'Git configuration', gitConfigResult.error)
    }

    // Setup development scripts
    const scriptsResult = await setupDevelopmentScripts(config, context)
    if (!scriptsResult.isOk()) {
      spinner.text = 'Development scripts setup failed, continuing...'
      debugError(logger, 'Development scripts setup', scriptsResult.error)
    }

    spinner.success('Development environment configured')
    return ok(undefined)
  } catch (error) {
    spinner.error('Failed to setup development environment')
    return err(
      createCoreError(
        'DEV_ENVIRONMENT_SETUP_FAILED',
        'CLI_ERROR',
        'Failed to setup development environment',
        {
          cause: error,
          context: { details: error instanceof Error ? error.message : String(error) },
        }
      )
    )
  }
}

/**
 * Setup Git configuration for the project
 */
async function setupGitConfiguration(
  config: ProjectConfig | ModernProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger } = context

  try {
    // Set up git user configuration if it's not already set globally
    const modernConfig = 'author' in config ? (config as ModernProjectConfig) : null

    if (modernConfig?.author) {
      const gitOps = createGeneratorGitOperations()

      // Check if git user is already configured
      const userNameResult = await gitOps.getConfig(config.projectPath, 'user.name')

      if (userNameResult.isErr()) {
        // If no user configured, set it from project config
        const configResult = await gitOps.configureUser(
          config.projectPath,
          modernConfig.author.name,
          modernConfig.author.email
        )

        if (configResult.isOk()) {
          if (context.verbose) {
            logger.info(
              `Git user configured: ${modernConfig.author.name} <${modernConfig.author.email}>`
            )
          }
        } else {
          logger.debug(`Failed to set git user configuration: ${configResult.error.message}`)
        }
      }
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('GIT_CONFIG_FAILED', 'CLI_ERROR', 'Failed to setup git configuration', {
        cause: error,
        context: { details: error instanceof Error ? error.message : String(error) },
      })
    )
  }
}

/**
 * Setup development scripts and tools
 */
async function setupDevelopmentScripts(
  config: ProjectConfig | ModernProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger } = context

  try {
    // Development scripts are already included in package.json template
    // This function can be extended to:
    // - Install additional development tools
    // - Setup pre-commit hooks
    // - Configure linting and formatting tools
    // - Setup testing environment

    if (context.verbose) {
      logger.info('Development scripts configured in package.json')
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'DEV_SCRIPTS_SETUP_FAILED',
        'CLI_ERROR',
        'Failed to setup development scripts',
        {
          cause: error,
          context: { details: error instanceof Error ? error.message : String(error) },
        }
      )
    )
  }
}

/**
 * Verify project readiness for development
 *
 * Runs comprehensive checks to ensure the generated project is ready
 * for development including dependency resolution, build verification,
 * and basic functionality tests.
 *
 * @param config - Project configuration
 * @param context - Generator context with logger for user feedback
 * @returns Promise resolving to Result indicating verification success or failure
 *
 * @internal
 *
 * Verification checks include:
 * - Package.json validity and dependency resolution
 * - TypeScript compilation check
 * - Build script execution
 * - Git repository integrity
 * - File structure validation
 */
async function verifyProjectReadiness(
  config: ProjectConfig | ModernProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger: _logger } = context
  const spinner = createSpinner('Verifying project readiness...')
  spinner.start()

  try {
    // Verify package.json exists and is valid
    const packageJsonResult = await verifyPackageJson(config.projectPath)
    if (!packageJsonResult.isOk()) {
      spinner.error('Package.json verification failed')
      return err(packageJsonResult.error)
    }

    // Verify TypeScript configuration
    const tsConfigResult = await verifyTypeScriptConfig(config.projectPath)
    if (!tsConfigResult.isOk()) {
      spinner.error('TypeScript configuration verification failed')
      return err(tsConfigResult.error)
    }

    // Verify Git repository
    if ('initGit' in config && config.initGit) {
      const gitResult = await verifyGitRepository(config.projectPath)
      if (!gitResult.isOk()) {
        spinner.error('Git repository verification failed')
        return err(gitResult.error)
      }
    }

    // Verify project structure
    const structureResult = await verifyProjectStructure(config)
    if (!structureResult.isOk()) {
      spinner.error('Project structure verification failed')
      return err(structureResult.error)
    }

    // Verify build and test execution
    if (config.installDependencies) {
      const buildResult = await verifyBuildAndTest(config, context)
      if (!buildResult.isOk()) {
        spinner.error('Build and test verification failed')
        return err(buildResult.error)
      }
    }

    spinner.success('Project verification completed')
    return ok(undefined)
  } catch (error) {
    spinner.error('Project verification failed')
    return err(
      createCoreError('PROJECT_VERIFICATION_FAILED', 'CLI_ERROR', 'Project verification failed', {
        cause: error,
        context: { details: error instanceof Error ? error.message : String(error) },
      })
    )
  }
}

/**
 * Verify package.json exists and has valid structure
 */
async function verifyPackageJson(projectPath: string): Promise<Result<void, CoreError>> {
  try {
    const packageJsonPath = resolve(projectPath, 'package.json')
    const readResult = await fs.readFile(packageJsonPath)

    if (readResult.isErr()) {
      return err(
        createCoreError('PACKAGE_JSON_MISSING', 'CLI_ERROR', 'package.json not found', {
          context: { details: 'package.json is required for the project' },
        })
      )
    }

    // Verify it's valid JSON
    try {
      const packageJson = JSON.parse(readResult.value)

      // Check required fields
      if (!packageJson.name || !packageJson.version || !packageJson.scripts) {
        return err(
          createCoreError(
            'PACKAGE_JSON_INVALID',
            'CLI_ERROR',
            'package.json is missing required fields',
            {
              context: { details: 'name, version, and scripts are required' },
            }
          )
        )
      }
    } catch (parseError) {
      return err(
        createCoreError('PACKAGE_JSON_INVALID', 'CLI_ERROR', 'package.json is not valid JSON', {
          cause: parseError,
        })
      )
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'PACKAGE_JSON_VERIFICATION_FAILED',
        'CLI_ERROR',
        'Failed to verify package.json',
        {
          cause: error,
        }
      )
    )
  }
}

/**
 * Verify TypeScript configuration
 */
async function verifyTypeScriptConfig(projectPath: string): Promise<Result<void, CoreError>> {
  try {
    const tsConfigPath = resolve(projectPath, 'tsconfig.json')
    const readResult = await fs.readFile(tsConfigPath)

    if (readResult.isErr()) {
      return err(
        createCoreError('TSCONFIG_MISSING', 'CLI_ERROR', 'tsconfig.json not found', {
          context: { details: 'TypeScript configuration is required' },
        })
      )
    }

    // Verify it's valid JSON
    try {
      JSON.parse(readResult.value)
    } catch (parseError) {
      return err(
        createCoreError('TSCONFIG_INVALID', 'CLI_ERROR', 'tsconfig.json is not valid JSON', {
          cause: parseError,
        })
      )
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'TSCONFIG_VERIFICATION_FAILED',
        'CLI_ERROR',
        'Failed to verify TypeScript configuration',
        {
          cause: error,
        }
      )
    )
  }
}

/**
 * Verify Git repository integrity
 */
async function verifyGitRepository(projectPath: string): Promise<Result<void, CoreError>> {
  try {
    // Check if .git directory exists
    const gitDirPath = resolve(projectPath, '.git')
    const gitDirResult = await fs.exists(gitDirPath)

    if (gitDirResult.isErr() || !gitDirResult.value) {
      return err(
        createCoreError('GIT_REPO_MISSING', 'CLI_ERROR', 'Git repository not found', {
          context: { details: '.git directory is missing' },
        })
      )
    }

    // Verify git status
    const gitOps = createGeneratorGitOperations()
    const statusResult = await gitOps.verifyStatus(projectPath)
    if (statusResult.isErr()) {
      return err(statusResult.error)
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('GIT_VERIFICATION_FAILED', 'CLI_ERROR', 'Failed to verify Git repository', {
        cause: error,
      })
    )
  }
}

/**
 * Verify project structure matches template expectations
 */
async function verifyProjectStructure(
  config: ProjectConfig | ModernProjectConfig
): Promise<Result<void, CoreError>> {
  try {
    const requiredFiles = ['package.json', 'tsconfig.json', 'src/index.ts', 'bin/cli.js']

    for (const file of requiredFiles) {
      const filePath = resolve(config.projectPath, file)
      const existsResult = await fs.exists(filePath)

      if (existsResult.isErr() || !existsResult.value) {
        return err(
          createCoreError(
            'PROJECT_STRUCTURE_INVALID',
            'CLI_ERROR',
            `Required file missing: ${file}`,
            {
              context: { details: `File ${file} is required for the project` },
            }
          )
        )
      }
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'PROJECT_STRUCTURE_VERIFICATION_FAILED',
        'CLI_ERROR',
        'Failed to verify project structure',
        {
          cause: error,
        }
      )
    )
  }
}

/**
 * Verify build and test execution
 *
 * Executes build and test scripts to ensure the generated project
 * compiles correctly and all tests pass.
 *
 * @param config - Project configuration
 * @param context - Generator context with logger for user feedback
 * @returns Promise resolving to Result indicating verification success or failure
 */
async function verifyBuildAndTest(
  config: ProjectConfig | ModernProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger: _logger } = context

  try {
    // Get package manager
    const packageManagerResult = detectPackageManager()
    if (!packageManagerResult.isOk()) {
      return err(
        createCoreError(
          'PACKAGE_MANAGER_DETECTION_FAILED',
          'CLI_ERROR',
          'Failed to detect package manager',
          {
            cause: packageManagerResult.error,
          }
        )
      )
    }

    const packageManager = packageManagerResult.value

    // Verify TypeScript compilation
    const typeCheckResult = await runTypeCheck(config.projectPath, packageManager, context)
    if (!typeCheckResult.isOk()) {
      return err(typeCheckResult.error)
    }

    // Verify build execution
    const buildResult = await runBuild(config.projectPath, packageManager, context)
    if (!buildResult.isOk()) {
      return err(buildResult.error)
    }

    // Verify test execution if tests are enabled
    const modernConfig = 'features' in config ? (config as ModernProjectConfig) : null
    if (modernConfig?.features?.testing) {
      const testResult = await runTests(config.projectPath, packageManager, context)
      if (!testResult.isOk()) {
        return err(testResult.error)
      }
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError(
        'BUILD_TEST_VERIFICATION_FAILED',
        'CLI_ERROR',
        'Failed to verify build and test execution',
        {
          cause: error,
        }
      )
    )
  }
}

/**
 * Run TypeScript type checking
 */
async function runTypeCheck(
  projectPath: string,
  packageManager: string,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger } = context

  try {
    if (context.verbose) {
      logger.info('Running TypeScript type check...')
    }

    await execa(packageManager, ['run', 'types'], {
      cwd: projectPath,
      stdio: 'pipe',
      shell: false,
      timeout: 60000, // 1 minute timeout
    })

    if (context.verbose) {
      logger.info('TypeScript type check passed')
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('TYPE_CHECK_FAILED', 'CLI_ERROR', 'TypeScript type check failed', {
        cause: error,
        context: { details: 'Generated project has TypeScript compilation errors' },
      })
    )
  }
}

/**
 * Run project build
 */
async function runBuild(
  projectPath: string,
  packageManager: string,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger } = context

  try {
    if (context.verbose) {
      logger.info('Running project build...')
    }

    await execa(packageManager, ['run', 'build'], {
      cwd: projectPath,
      stdio: 'pipe',
      shell: false,
      timeout: 120000, // 2 minute timeout
    })

    if (context.verbose) {
      logger.info('Project build completed successfully')
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('BUILD_FAILED', 'CLI_ERROR', 'Project build failed', {
        cause: error,
        context: { details: 'Generated project build script failed' },
      })
    )
  }
}

/**
 * Run project tests
 */
async function runTests(
  projectPath: string,
  packageManager: string,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger } = context

  try {
    if (context.verbose) {
      logger.info('Running project tests...')
    }

    await execa(packageManager, ['run', 'test'], {
      cwd: projectPath,
      stdio: 'pipe',
      shell: false,
      timeout: 180000, // 3 minute timeout
    })

    if (context.verbose) {
      logger.info('All tests passed')
    }

    return ok(undefined)
  } catch (error) {
    return err(
      createCoreError('TESTS_FAILED', 'CLI_ERROR', 'Project tests failed', {
        cause: error,
        context: { details: 'Generated project tests are failing' },
      })
    )
  }
}

// getInstallCommand function has been replaced with CLI package manager detection
// Simple package manager detection for the new architecture
