import { Ok, Err, createError } from '@esteban-url/trailhead-cli/core';
import { resolve, dirname } from 'path';
import { createNodeFileSystem } from '@esteban-url/trailhead-cli/filesystem';
import { fileURLToPath } from 'url';
import {
  executeGitCommandSimple,
  validateGitEnvironment,
} from '@esteban-url/trailhead-cli/git';
import { detectPackageManager } from '@esteban-url/trailhead-cli/utils';
import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import {
  validateProjectName,
  validateProjectPath,
  validatePackageManager,
  validateTemplate,
  validateOutputPath,
} from './validation.js';

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import type {
  ProjectConfig,
  TemplateContext,
  GeneratorContext,
} from './types.js';
import { createTemplateContext } from './template-context.js';
import { getTemplateFiles } from './template-loader.js';
import { TemplateCompiler } from './template-compiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global filesystem instance
const fs = createNodeFileSystem();

// Global template compiler instance for caching
const templateCompiler = new TemplateCompiler();

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
 * if (result.success) {
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
  context: GeneratorContext,
): Promise<Result<void, CLIError>> {
  const { logger, verbose } = context;

  try {
    // Phase 0: Validate configuration
    const validationResult = validateProjectConfig(config);
    if (!validationResult.success) {
      return validationResult;
    }

    logger.info(
      `Generating ${config.template} CLI project: ${chalk.cyan(config.projectName)}`,
    );

    if (config.dryRun) {
      logger.info(chalk.yellow('DRY RUN MODE - No files will be created'));
    }

    // Phase 1: Prepare template context
    const templateContext = await createTemplateContext(config);
    if (verbose) {
      logger.debug('Template context:', templateContext);
    }

    // Phase 2: Load template files
    const templateFiles = await getTemplateFiles(
      config.template,
      context.templateConfig,
    );
    logger.info(`Found ${templateFiles.length} template files`);

    // Phase 2.5: Pre-compile templates for better performance
    // Get the resolved template directory from template loader
    const { resolveTemplatePaths } = await import('./template-loader.js');
    const { paths } = resolveTemplatePaths(
      config.template,
      context.templateConfig,
    );
    const templatePaths = templateFiles
      .filter((f) => f.isTemplate)
      .map((f) => resolve(paths.base, f.source));

    if (templatePaths.length > 0) {
      const precompileSpinner = ora('Pre-compiling templates...').start();
      await templateCompiler.precompileTemplates(templatePaths);
      precompileSpinner.succeed(
        `Pre-compiled ${templatePaths.length} templates`,
      );
    }

    // Phase 3: Create project directory
    if (!config.dryRun) {
      const createDirResult = await createProjectDirectory(config.projectPath);
      if (!createDirResult.success) {
        return createDirResult;
      }
    }

    // Phase 4: Process and copy files
    const spinner = ora('Processing template files...').start();
    const startTime = performance.now();

    for (const templateFile of templateFiles) {
      const result = await processTemplateFile(
        templateFile,
        templateContext,
        config,
        context,
      );

      if (!result.success) {
        spinner.fail(`Failed to process ${templateFile.source}`);
        return result;
      }

      if (verbose) {
        spinner.text = `Processed ${templateFile.destination}`;
      }
    }

    const processingTime = performance.now() - startTime;
    const avgTimePerFile = processingTime / templateFiles.length;

    spinner.succeed(
      `Template files processed (${Math.round(processingTime)}ms, ${Math.round(avgTimePerFile)}ms avg)`,
    );

    if (verbose) {
      const cacheStats = templateCompiler.getCacheStats();
      logger.debug(`Template cache: ${cacheStats.size} entries cached`);
    }

    // Phase 5: Initialize git repository
    if (config.initGit && !config.dryRun) {
      const gitResult = await initializeGitRepository(
        config.projectPath,
        context,
      );
      if (!gitResult.success) {
        logger.warning('Failed to initialize git repository');
      }
    }

    // Phase 6: Install dependencies
    if (config.installDependencies && !config.dryRun) {
      const installResult = await installDependencies(config, context);
      if (!installResult.success) {
        logger.warning('Failed to install dependencies');
      }
    }

    // Phase 7: Cleanup template cache if needed
    templateCompiler.cleanup(50); // Keep max 50 entries

    return Ok(undefined);
  } catch (error) {
    logger.error('Generator failed:', error);
    return Err(
      createError('GENERATOR_FAILED', 'Project generation failed', {
        cause: error,
        details: error instanceof Error ? error.message : String(error),
      }),
    );
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
function validateProjectConfig(config: ProjectConfig): Result<void, CLIError> {
  // Validate project name with security checks
  const nameValidation = validateProjectName(config.projectName);
  if (!nameValidation.success) {
    return nameValidation;
  }

  // Validate project path with directory traversal protection
  const pathValidation = validateProjectPath(config.projectPath, process.cwd());
  if (!pathValidation.success) {
    return pathValidation;
  }

  // Validate template with whitelist
  const templateValidation = validateTemplate(config.template);
  if (!templateValidation.success) {
    return templateValidation;
  }

  // Validate package manager with whitelist
  const packageManagerValidation = validatePackageManager(
    config.packageManager,
  );
  if (!packageManagerValidation.success) {
    return packageManagerValidation;
  }

  return Ok(undefined);
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
 * @throws {CLIError} When directory creation fails due to permissions or filesystem issues
 */
async function createProjectDirectory(
  projectPath: string,
): Promise<Result<void, CLIError>> {
  const result = await fs.ensureDir(projectPath);
  if (!result.success) {
    return Err(
      createError(
        'DIRECTORY_CREATE_FAILED',
        'Failed to create project directory',
        {
          cause: result.error,
          details: result.error.message,
        },
      ),
    );
  }
  return Ok(undefined);
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
  context: GeneratorContext,
): Promise<Result<void, CLIError>> {
  try {
    const { logger, verbose } = context;

    // Validate template source path to prevent directory traversal
    // Get the resolved template directory from template loader
    const { resolveTemplatePaths } = await import('./template-loader.js');
    const { paths } = resolveTemplatePaths(
      config.template,
      context.templateConfig,
    );
    const baseTemplateDir = paths.base;
    const templatePathValidation = validateOutputPath(
      templateFile.source,
      baseTemplateDir,
    );
    if (!templatePathValidation.success) {
      return templatePathValidation;
    }

    // Validate output destination path to prevent directory traversal
    const outputPathValidation = validateOutputPath(
      templateFile.destination,
      config.projectPath,
    );
    if (!outputPathValidation.success) {
      return outputPathValidation;
    }

    const templatePath = templatePathValidation.value;
    const outputPath = outputPathValidation.value;

    if (config.dryRun) {
      logger.info(`Would create: ${templateFile.destination}`);
      return Ok(undefined);
    }

    // Ensure output directory exists
    const ensureDirResult = await fs.ensureDir(dirname(outputPath));
    if (!ensureDirResult.success) {
      return Err(
        createError(
          'TEMPLATE_PROCESS_FAILED',
          `Failed to create output directory ${dirname(outputPath)}`,
          {
            cause: ensureDirResult.error,
            details: ensureDirResult.error.message,
          },
        ),
      );
    }

    if (templateFile.isTemplate) {
      // Process template with optimized compiler
      const processedContent = await templateCompiler.compileTemplate(
        templatePath,
        templateContext,
      );

      const writeResult = await fs.writeFile(outputPath, processedContent);
      if (!writeResult.success) {
        return Err(
          createError(
            'TEMPLATE_PROCESS_FAILED',
            `Failed to write template file ${outputPath}`,
            {
              cause: writeResult.error,
              details: writeResult.error.message,
            },
          ),
        );
      }

      if (verbose) {
        logger.debug(
          `Processed template: ${templateFile.source} -> ${templateFile.destination}`,
        );
      }
    } else {
      // Copy file as-is
      const copyResult = await fs.cp(templatePath, outputPath);
      if (!copyResult.success) {
        return Err(
          createError(
            'TEMPLATE_PROCESS_FAILED',
            `Failed to copy file ${templatePath} to ${outputPath}`,
            {
              cause: copyResult.error,
              details: copyResult.error.message,
            },
          ),
        );
      }

      if (verbose) {
        logger.debug(
          `Copied file: ${templateFile.source} -> ${templateFile.destination}`,
        );
      }
    }

    // Set executable permissions if needed
    // Note: CLI filesystem doesn't expose chmod, so we'll use fs directly for now
    if (templateFile.executable) {
      try {
        const { chmod } = await import('node:fs/promises');
        await chmod(outputPath, 0o755);
      } catch {
        // Non-critical error, just log it
        if (verbose) {
          logger.debug(
            `Warning: Could not set executable permissions for ${outputPath}`,
          );
        }
      }
    }

    return Ok(undefined);
  } catch (error) {
    return Err(
      createError(
        'TEMPLATE_PROCESS_FAILED',
        `Failed to process template file ${templateFile.source}`,
        {
          cause: error,
          details: error instanceof Error ? error.message : String(error),
        },
      ),
    );
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
  context: GeneratorContext,
): Promise<Result<void, CLIError>> {
  const { logger: _logger } = context;

  // Validate project path to prevent command injection
  const pathValidation = validateProjectPath(projectPath, process.cwd());
  if (!pathValidation.success) {
    return pathValidation;
  }
  const safePath = pathValidation.value;

  const spinner = ora('Initializing git repository...').start();

  // Check if git is available and environment is valid
  const envCheck = await validateGitEnvironment({ cwd: safePath });
  if (!envCheck.success) {
    spinner.fail('Git not available');
    return Err(
      createError('GIT_INIT_FAILED', 'Git environment validation failed', {
        cause: envCheck.error,
        details: 'Git is not installed or not available in PATH',
      }),
    );
  }

  // Initialize git repository
  const initResult = await executeGitCommandSimple(['init'], { cwd: safePath });
  if (!initResult.success) {
    spinner.fail('Failed to initialize git repository');
    return Err(
      createError('GIT_INIT_FAILED', 'Failed to initialize git repository', {
        cause: initResult.error,
        details: 'Git init command failed',
      }),
    );
  }

  // Stage all files
  const addResult = await executeGitCommandSimple(['add', '.'], {
    cwd: safePath,
  });
  if (!addResult.success) {
    spinner.fail('Failed to stage files');
    return Err(
      createError(
        'GIT_INIT_FAILED',
        'Failed to stage files for initial commit',
        {
          cause: addResult.error,
          details: 'Git add command failed',
        },
      ),
    );
  }

  // Create initial commit
  const commitMessage = 'feat: initial commit with trailhead-cli generator';
  const commitResult = await executeGitCommandSimple(
    ['commit', '-m', commitMessage],
    { cwd: safePath },
  );
  if (!commitResult.success) {
    spinner.fail('Failed to create initial commit');
    return Err(
      createError('GIT_INIT_FAILED', 'Failed to create initial commit', {
        cause: commitResult.error,
        details: 'Git commit command failed',
      }),
    );
  }

  spinner.succeed('Git repository initialized');
  return Ok(undefined);
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
  context: GeneratorContext,
): Promise<Result<void, CLIError>> {
  const { logger: _logger } = context;

  try {
    // Validate project path to prevent command injection
    const pathValidation = validateProjectPath(
      config.projectPath,
      process.cwd(),
    );
    if (!pathValidation.success) {
      return pathValidation;
    }
    const safePath = pathValidation.value;

    // Use CLI package manager detection instead of manual validation
    const packageManagerResult = detectPackageManager();
    if (!packageManagerResult.success) {
      return Err(
        createError(
          'PACKAGE_MANAGER_NOT_FOUND',
          'No suitable package manager found',
          {
            cause: packageManagerResult.error,
            details: packageManagerResult.error.message,
            suggestion: packageManagerResult.error.suggestion,
          },
        ),
      );
    }

    const packageManager = packageManagerResult.value;
    const spinner = ora(
      `Installing dependencies with ${packageManager.name}...`,
    ).start();

    // Use CLI package manager configuration
    const installArgs =
      packageManager.name === 'pnpm'
        ? ['install', '--ignore-workspace']
        : ['install'];

    await execa(packageManager.command, installArgs, {
      cwd: safePath,
      stdio: 'pipe', // Prevent output injection
      shell: false, // Disable shell interpretation
      timeout: 300000, // 5 minute timeout for security
    });

    spinner.succeed('Dependencies installed');
    return Ok(undefined);
  } catch (error) {
    return Err(
      createError(
        'DEPENDENCY_INSTALL_FAILED',
        'Failed to install dependencies',
        {
          cause: error,
          details:
            'Dependency installation failed - ensure the package manager is installed and accessible',
        },
      ),
    );
  }
}

// getInstallCommand function has been replaced with CLI package manager detection
// See detectPackageManager() from @esteban-url/trailhead-cli/utils
