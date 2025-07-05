import { Ok, Err, createError } from '@esteban-url/trailhead-cli/core';
import { resolve, join, dirname } from 'path';
import fs from 'fs-extra';
const { ensureDir, copy, writeFile, chmod } = fs;
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';

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
    const templatePaths = templateFiles
      .filter((f) => f.isTemplate)
      .map((f) => resolve(dirname(__filename), '../templates', f.source));

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
        logger.warn('Failed to initialize git repository');
      }
    }

    // Phase 6: Install dependencies
    if (config.installDependencies && !config.dryRun) {
      const installResult = await installDependencies(config, context);
      if (!installResult.success) {
        logger.warn('Failed to install dependencies');
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
 * Performs comprehensive validation of all project configuration parameters
 * to ensure they meet requirements and prevent generation failures.
 *
 * @param config - Project configuration to validate
 * @returns Result indicating validation success or specific validation errors
 *
 * @internal
 *
 * Validation checks include:
 * - Project name: must be non-empty string
 * - Project path: must be non-empty string
 * - Template: must be one of 'basic', 'advanced', 'enterprise'
 * - Package manager: must be one of 'npm', 'pnpm', 'yarn', 'bun'
 */
function validateProjectConfig(config: ProjectConfig): Result<void, CLIError> {
  if (!config.projectName || config.projectName.trim() === '') {
    return Err(
      createError('VALIDATION_FAILED', 'Project name is required', {
        details: 'Please provide a valid project name',
      }),
    );
  }

  if (!config.projectPath || config.projectPath.trim() === '') {
    return Err(
      createError('VALIDATION_FAILED', 'Project path is required', {
        details: 'Please provide a valid project path',
      }),
    );
  }

  const validTemplates = ['basic', 'advanced', 'enterprise'];
  if (!validTemplates.includes(config.template)) {
    return Err(
      createError('VALIDATION_FAILED', `Invalid template: ${config.template}`, {
        details: `Supported templates: ${validTemplates.join(', ')}`,
      }),
    );
  }

  const validPackageManagers = ['npm', 'pnpm', 'yarn', 'bun'];
  if (!validPackageManagers.includes(config.packageManager)) {
    return Err(
      createError(
        'VALIDATION_FAILED',
        `Invalid package manager: ${config.packageManager}`,
        {
          details: `Supported package managers: ${validPackageManagers.join(', ')}`,
        },
      ),
    );
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
  try {
    await ensureDir(projectPath);
    return Ok(undefined);
  } catch (error) {
    return Err(
      createError(
        'DIRECTORY_CREATE_FAILED',
        'Failed to create project directory',
        {
          cause: error,
          details: error instanceof Error ? error.message : String(error),
        },
      ),
    );
  }
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
    const templatePath = resolve(
      dirname(__filename),
      '../templates',
      templateFile.source,
    );
    const outputPath = join(config.projectPath, templateFile.destination);

    if (config.dryRun) {
      logger.info(`Would create: ${templateFile.destination}`);
      return Ok(undefined);
    }

    // Ensure output directory exists
    await ensureDir(dirname(outputPath));

    if (templateFile.isTemplate) {
      // Process template with optimized compiler
      const processedContent = await templateCompiler.compileTemplate(
        templatePath,
        templateContext,
      );

      await writeFile(outputPath, processedContent, 'utf-8');

      if (verbose) {
        logger.debug(
          `Processed template: ${templateFile.source} -> ${templateFile.destination}`,
        );
      }
    } else {
      // Copy file as-is
      await copy(templatePath, outputPath);

      if (verbose) {
        logger.debug(
          `Copied file: ${templateFile.source} -> ${templateFile.destination}`,
        );
      }
    }

    // Set executable permissions if needed
    if (templateFile.executable) {
      await chmod(outputPath, 0o755);
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
 *
 * @param projectPath - Absolute path to the project directory
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

  try {
    const spinner = ora('Initializing git repository...').start();

    await execa('git', ['init'], { cwd: projectPath });
    await execa('git', ['add', '.'], { cwd: projectPath });
    await execa(
      'git',
      ['commit', '-m', 'feat: initial commit with trailhead-cli generator'],
      { cwd: projectPath },
    );

    spinner.succeed('Git repository initialized');
    return Ok(undefined);
  } catch (error) {
    return Err(
      createError('GIT_INIT_FAILED', 'Failed to initialize git repository', {
        cause: error,
        details: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

/**
 * Install project dependencies using the configured package manager
 *
 * Executes the appropriate install command for the selected package manager
 * (npm, pnpm, yarn, or bun) in the project directory.
 *
 * @param config - Project configuration containing package manager selection
 * @param context - Generator context with logger for user feedback
 * @returns Promise resolving to Result indicating installation success or failure
 *
 * @internal
 *
 * Supported package managers:
 * - npm: `npm install`
 * - pnpm: `pnpm install`
 * - yarn: `yarn install`
 * - bun: `bun install`
 *
 * Installation runs with piped stdio to suppress verbose output while
 * still capturing errors for diagnostics.
 *
 * @see {@link getInstallCommand} for command resolution logic
 */
async function installDependencies(
  config: ProjectConfig,
  context: GeneratorContext,
): Promise<Result<void, CLIError>> {
  const { logger: _logger } = context;

  try {
    const spinner = ora(
      `Installing dependencies with ${config.packageManager}...`,
    ).start();

    const installCommand = getInstallCommand(config.packageManager);
    await execa(installCommand.command, installCommand.args, {
      cwd: config.projectPath,
      stdio: 'pipe',
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
          details: error instanceof Error ? error.message : String(error),
        },
      ),
    );
  }
}

/**
 * Get package manager install command configuration
 *
 * Maps package manager names to their respective install commands and arguments.
 * Supports all major Node.js package managers with fallback to npm.
 *
 * @param packageManager - Package manager identifier ('npm', 'pnpm', 'yarn', 'bun')
 * @returns Object containing the executable command and its arguments array
 *
 * @internal
 *
 * @example
 * ```typescript
 * const npmCmd = getInstallCommand('npm')
 * // Returns: { command: 'npm', args: ['install'] }
 *
 * const pnpmCmd = getInstallCommand('pnpm')
 * // Returns: { command: 'pnpm', args: ['install'] }
 * ```
 *
 * @default Falls back to npm if package manager is not recognized
 */
function getInstallCommand(packageManager: string): {
  command: string;
  args: string[];
} {
  switch (packageManager) {
    case 'pnpm':
      return { command: 'pnpm', args: ['install'] };
    case 'yarn':
      return { command: 'yarn', args: ['install'] };
    case 'bun':
      return { command: 'bun', args: ['install'] };
    default:
      return { command: 'npm', args: ['install'] };
  }
}
