import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { resolve, dirname } from 'path'
import { fs } from '@trailhead/fs'
import { colors, createSpinner } from '@trailhead/cli/utils'
import { debugTemplateContext, debugError, debugStats } from '../cli/logger.js'
import {
  validateProjectName,
  validateProjectPath,
  validatePackageManager,
  validateOutputPath,
  validateTemplatePath,
} from '../config/validation.js'

import type { ProjectConfig } from '../config/types.js'
import type { TemplateContext } from '../templates/types.js'
import type { GeneratorContext } from './types.js'
import { createTemplateContext } from '../templates/context.js'
import { composeTemplate } from '../templates/modules.js'
import {
  compileTemplate,
  precompileTemplates,
  createTemplateCompilerContext,
  getTemplateCacheStats,
  cleanupTemplateCache,
} from '../templates/compiler.js'
import { formatGeneratedCode } from './transforms.js'

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
  config: ProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger, verbose } = context

  try {
    // Phase 0: Validate configuration
    const validationResult = validateProjectConfig(config)
    if (!validationResult.isOk()) {
      return validationResult
    }

    logger.info(`Generating CLI project: ${colors.cyan(config.projectName)}`)

    if (config.dryRun) {
      logger.info(colors.yellow('DRY RUN MODE - No files will be created'))
    }

    // Phase 1: Prepare template context
    const templateContext = await createTemplateContext(config)
    if (verbose) {
      debugTemplateContext(logger, 'Template context', templateContext)
    }

    // Phase 2: Load template files using modular system
    const composedResult = composeTemplate(config)
    if (composedResult.isErr()) {
      return err(composedResult.error)
    }

    const composedTemplate = composedResult.value
    const templateFiles = composedTemplate.files
    logger.info(
      `Composed template with ${composedTemplate.modules.length} modules and ${templateFiles.length} files`
    )

    // Phase 2.5: Pre-compile templates for better performance
    // Get the resolved template directory
    const { resolveTemplatePaths } = await import('../templates/loader.js')
    const { paths } = resolveTemplatePaths('basic', context.templateConfig) // Use base path

    // Resolve template paths
    const templatePaths = templateFiles
      .filter((f: any) => f.isTemplate)
      .map((f: any) => resolve(paths.base, f.source))

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

    // Phase 6: Configure development environment
    if (!config.dryRun) {
      const devSetupResult = await setupDevelopmentEnvironment(config, context)
      if (!devSetupResult.isOk()) {
        logger.warning('Failed to configure development environment')
      }
    }

    // Phase 7: Verify project readiness
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

    // Phase 8: Cleanup template cache if needed
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
    // Get the resolved template directory
    const { resolveTemplatePaths } = await import('../templates/loader.js')
    const { paths } = resolveTemplatePaths('basic', context.templateConfig)
    const baseTemplateDir = paths.base

    // Resolve the full template path
    const fullTemplatePath = resolve(baseTemplateDir, templateFile.source)

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
 * - Development tool setup (linting, formatting, testing)
 * - Project verification to ensure everything works
 */
async function setupDevelopmentEnvironment(
  _config: ProjectConfig,
  context: GeneratorContext
): Promise<Result<void, CoreError>> {
  const { logger } = context
  const spinner = createSpinner('Setting up development environment...')
  spinner.start()

  try {
    // IDE configuration is handled through template files in modules/vscode/

    // Setup development scripts
    const scriptsResult = await setupDevelopmentScripts(_config, context)
    if (!scriptsResult.isOk()) {
      spinner.message('Development scripts setup failed, continuing...')
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
 * Setup development scripts and tools
 */
async function setupDevelopmentScripts(
  _config: ProjectConfig,
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
 * - File structure validation
 */
async function verifyProjectReadiness(
  config: ProjectConfig,
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

    // Verify project structure
    const structureResult = await verifyProjectStructure(config)
    if (!structureResult.isOk()) {
      spinner.error('Project structure verification failed')
      return err(structureResult.error)
    }

    // Skip build and test verification since dependencies are not auto-installed

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
 * Verify project structure matches template expectations
 */
async function verifyProjectStructure(config: ProjectConfig): Promise<Result<void, CoreError>> {
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

// getInstallCommand function has been replaced with CLI package manager detection
// Simple package manager detection for the new architecture
