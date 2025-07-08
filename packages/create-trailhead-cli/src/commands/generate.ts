import { createCommand, type CommandContext } from '@esteban-url/trailhead-cli/command';
import { Ok, Err, createError } from '@esteban-url/trailhead-cli/core';
import { select, confirm } from '@inquirer/prompts';
import { resolve } from 'path';
import { existsSync } from 'fs';

import { generateProject } from '../lib/generator.js';
// Define options interface for type safety
interface GenerateCommandOptions {
  template?: string;
  'package-manager'?: string;
  docs?: boolean;
  typescript?: boolean;
  git?: boolean;
  install?: boolean;
  force?: boolean;
  'dry-run'?: boolean;
}

import { type GenerateOptions, type TemplateVariant, type PackageManager } from '../lib/types.js';

/**
 * Command line options interface for the generate command
 *
 * Defines all available command-line options that can be passed to the
 * generate command, supporting both interactive and express execution modes.
 *
 * @interface
 */
interface GenerateCommandOptions {
  template?: string;
  packageManager?: string;
  docs?: boolean;
  typescript?: boolean;
  git?: boolean;
  install?: boolean;
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Main project generation command for create-trailhead-cli
 *
 * This command provides the primary interface for generating new CLI projects
 * using the trailhead-cli framework. It supports two execution modes:
 *
 * **Interactive Mode**: When minimal options are provided, prompts the user
 * for missing configuration through an interactive CLI interface.
 *
 * **Express Mode**: When all required options are provided via command line,
 * executes generation immediately without user prompts.
 *
 * The command handles project validation, directory conflict resolution,
 * template processing, git initialization, and dependency installation.
 *
 * @example
 * ```bash
 * # Interactive mode
 * create-trailhead-cli my-project
 *
 * # Express mode
 * create-trailhead-cli my-project --template advanced --package-manager pnpm --git --install
 *
 * # Dry run mode
 * create-trailhead-cli my-project --dry-run --template advanced
 * ```
 *
 * Features:
 * - Template variants: basic, advanced
 * - Package manager support: npm, pnpm
 * - Optional documentation generation
 * - Git repository initialization
 * - Automatic dependency installation
 * - Directory conflict handling with --force flag
 * - Dry run mode for preview
 *
 * @see {@link generateProject} for the core generation logic
 * @see {@link ProjectConfig} for configuration structure
 */
export const generateCommand = createCommand<GenerateCommandOptions>({
  name: 'generate',
  description: 'Generate a new CLI project with trailhead-cli',
  arguments: '<project-name>',
  options: [
    {
      name: 'template',
      alias: 't',
      type: 'string',
      description: 'Template variant (basic, advanced)',
    },
    {
      name: 'package-manager',
      alias: 'p',
      type: 'string',
      description: 'Package manager to use',
    },
    {
      name: 'docs',
      type: 'boolean',
      description: 'Include full documentation structure',
    },
    {
      name: 'typescript',
      type: 'boolean',
      description: 'Use TypeScript (always true for trailhead-cli)',
    },
    {
      name: 'git',
      type: 'boolean',
      description: 'Initialize git repository',
    },
    {
      name: 'install',
      type: 'boolean',
      description: 'Install dependencies after generation',
    },
    {
      name: 'force',
      type: 'boolean',
      description: 'Overwrite existing directory',
    },
    {
      name: 'dry-run',
      type: 'boolean',
      description: 'Show what would be generated without creating files',
    },
  ],
  action: async (options: GenerateCommandOptions, context: CommandContext) => {
    const { logger, verbose } = context;
    const projectName = context.args[0];

    try {
      // Validate project name
      if (!projectName) {
        logger.error('Project name is required');
        logger.info('Usage: create-trailhead-cli <project-name>');
        return Err(
          createError('MISSING_PROJECT_NAME', 'Project name is required', {
            suggestion: 'Provide a project name as the first argument',
          })
        );
      }

      // Check if directory exists
      const projectPath = resolve(process.cwd(), projectName);
      if (existsSync(projectPath) && !options.force) {
        logger.error(`Directory '${projectName}' already exists. Use --force to overwrite.`);
        return Err(
          createError('DIRECTORY_EXISTS', `Directory '${projectName}' already exists`, {
            suggestion: 'Use --force to overwrite or choose a different name',
          })
        );
      }

      // Initialize with defaults
      let generateOptions: GenerateOptions = {
        template: 'basic',
        packageManager: 'pnpm',
        includeDocs: false,
        initGit: true,
        installDependencies: true,
      };

      // Express mode: use provided options
      if (isExpressMode(options)) {
        generateOptions.template = (options.template as TemplateVariant) || 'basic';
        generateOptions.packageManager = (options.packageManager as PackageManager) || 'pnpm';
        generateOptions.includeDocs = options.docs ?? false;
        generateOptions.initGit = options.git ?? true;
        generateOptions.installDependencies = options.install ?? true;
      } else {
        // Interactive mode: gather configuration
        const interactiveConfig = await gatherConfiguration(options, logger);
        generateOptions = { ...generateOptions, ...interactiveConfig };
      }

      // Generate project
      const result = await generateProject(
        {
          projectName,
          projectPath,
          ...generateOptions,
          dryRun: options.dryRun ?? false,
        },
        { logger, fs: undefined, verbose }
      );

      if (result.success) {
        logger.success(`Successfully generated '${projectName}'`);

        if (!options.dryRun) {
          logger.info('');
          logger.info('Next steps:');
          logger.info(`  cd ${projectName}`);
          if (!generateOptions.installDependencies) {
            logger.info(`  ${generateOptions.packageManager} install`);
          }
          logger.info(`  ${generateOptions.packageManager} dev`);
          logger.info('');
          logger.info('Happy coding! 🚀');
        }

        return Ok(undefined);
      } else {
        logger.error(`Failed to generate project: ${result.error.message}`);
        return Err(result.error);
      }
    } catch (error) {
      logger.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      return Err(
        createError('UNEXPECTED_ERROR', error instanceof Error ? error.message : String(error), {
          cause: error,
        })
      );
    }
  },
});

/**
 * Gather configuration through interactive prompts
 */
async function gatherConfiguration(
  options: GenerateCommandOptions,
  _logger: any
): Promise<Partial<GenerateOptions>> {
  const config: Partial<GenerateOptions> = {};

  // Template selection
  if (!options.template) {
    config.template = (await select({
      message: 'Which template would you like to use?',
      choices: [
        { name: 'Basic - Minimal CLI with essential features', value: 'basic' },
        {
          name: 'Advanced - Basic features plus configuration and validation',
          value: 'advanced',
        },
      ],
      default: 'basic',
    })) as TemplateVariant;
  }

  // Package manager selection
  if (!options.packageManager) {
    config.packageManager = (await select({
      message: 'Which package manager do you prefer?',
      choices: [
        { name: 'pnpm (recommended)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
      ],
      default: 'pnpm',
    })) as PackageManager;
  }

  // Additional features
  if (options.docs === undefined) {
    config.includeDocs = await confirm({
      message: 'Include full documentation structure (Diátaxis framework)?',
      default: false,
    });
  }

  if (options.git === undefined) {
    config.initGit = await confirm({
      message: 'Initialize git repository?',
      default: true,
    });
  }

  if (options.install === undefined) {
    config.installDependencies = await confirm({
      message: 'Install dependencies after generation?',
      default: true,
    });
  }

  return config;
}

/**
 * Check if we're in express mode (non-interactive)
 */
function isExpressMode(options: GenerateCommandOptions): boolean {
  return Boolean(
    options.template ||
      options.packageManager ||
      options.docs !== undefined ||
      options.git !== undefined ||
      options.install !== undefined
  );
}
