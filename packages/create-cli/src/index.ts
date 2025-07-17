#!/usr/bin/env node

import { createCLI } from '@esteban-url/cli'
import { createDefaultLogger } from '@esteban-url/cli/utils'
import { generateProject } from './lib/generator.js'
import { gatherProjectConfig } from './lib/interactive-prompts.js'
import { configCommand } from './commands/config.js'
import { createCommand } from '@esteban-url/cli/command'
import type { CommandOptions, CommandContext } from '@esteban-url/cli/command'
import { ok, err } from '@esteban-url/core'
import type { Result, CoreError } from '@esteban-url/core'
import { createGeneratorError, ERROR_CODES, ERROR_SUGGESTIONS } from './lib/error-helpers.js'

// Export utilities for programmatic use
export { generateProject } from './lib/generator.js'
export { getTemplateFiles } from './lib/template-loader.js'
export {
  createTemplateConfig,
  createTestTemplateConfig,
  createDevTemplateConfig,
  validateTemplateConfig,
  getTemplateConfigSummary,
} from './lib/template-config.js'
export type {
  ProjectConfig,
  TemplateContext,
  TemplateFile,
  TemplateLoaderConfig,
  TemplateVariant,
  PackageManager,
  GeneratorContext,
} from './lib/types.js'
export type { ModernProjectConfig } from './lib/interactive-prompts.js'

/**
 * Generate command options
 */
interface GenerateOptions extends CommandOptions {
  /** Template variant to use */
  readonly template?: string
  /** Package manager preference */
  readonly packageManager?: string
  /** Include documentation features */
  readonly docs?: boolean
  /** Skip git repository initialization */
  readonly noGit?: boolean
  /** Skip dependency installation */
  readonly noInstall?: boolean
  /** Skip interactive prompts */
  readonly nonInteractive?: boolean
  /** Overwrite existing directory */
  readonly force?: boolean
  /** Show what would be generated without creating files */
  readonly dryRun?: boolean
}

/**
 * Generate command - creates new CLI projects
 */
const generateCommand = createCommand<GenerateOptions>({
  name: 'generate',
  description: 'Generate a new CLI project using the @esteban-url/* architecture',
  arguments: '[project-name]',
  options: [
    {
      flags: '-t, --template <type>',
      description: 'Template variant (basic, advanced)',
      type: 'string',
    },
    {
      flags: '-p, --package-manager <pm>',
      description: 'Package manager (npm, pnpm)',
      type: 'string',
    },
    {
      flags: '--docs',
      description: 'Include documentation features',
      type: 'boolean',
    },
    {
      flags: '--no-git',
      description: 'Skip git repository initialization',
      type: 'boolean',
    },
    {
      flags: '--no-install',
      description: 'Skip dependency installation',
      type: 'boolean',
    },
    {
      flags: '--non-interactive',
      description: 'Skip interactive prompts (requires project name)',
      type: 'boolean',
    },
    {
      flags: '--force',
      description: 'Overwrite existing directory',
      type: 'boolean',
    },
  ],
  examples: [
    'generate my-cli',
    'generate my-cli --template basic --non-interactive',
    'generate my-cli --template advanced --docs --package-manager npm',
    'generate my-cli --dry-run',
  ],
  action: async (
    options: GenerateOptions,
    context: CommandContext
  ): Promise<Result<void, CoreError>> => {
    try {
      const logger = createDefaultLogger(options.verbose)
      const projectName = context.args[0]

      // Interactive mode when no project name provided
      if (!projectName && !options.nonInteractive) {
        return err(
          createGeneratorError(
            ERROR_CODES.PROJECT_NAME_REQUIRED,
            'Project name is required. Use the generate command with a project name.',
            {
              operation: 'generateCommand',
              suggestion: ERROR_SUGGESTIONS.CLI_USAGE,
            }
          )
        )
      }

      // Non-interactive mode - validate project name
      if (!projectName) {
        return err(
          createGeneratorError(
            ERROR_CODES.PROJECT_NAME_REQUIRED,
            'Project name is required when not in interactive mode',
            {
              operation: 'generateCommand',
              suggestion: ERROR_SUGGESTIONS.NON_INTERACTIVE_HELP,
            }
          )
        )
      }

      // Convert options to config format
      const flags = {
        template: (options.template || 'basic') as 'basic' | 'advanced',
        packageManager: (options.packageManager || 'pnpm') as 'npm' | 'pnpm',
        docs: options.docs,
        'no-git': options.noGit,
        'no-install': options.noInstall,
        force: options.force,
        'dry-run': options.dryRun,
        verbose: options.verbose,
        'non-interactive': true,
      }

      const configResult = await gatherProjectConfig(projectName, flags)

      if (configResult.isErr()) {
        return err(
          createGeneratorError(
            ERROR_CODES.CONFIG_GATHER_ERROR,
            `Failed to configure project: ${configResult.error.message}`,
            {
              operation: 'generateCommand',
              cause: configResult.error,
            }
          )
        )
      }

      const config = configResult.value

      context.logger.info(`Generating ${config.template} CLI project: ${config.projectName}`)

      const result = await generateProject(config, {
        logger,
        verbose: options.verbose || false,
        templateConfig: undefined,
      })

      if (result.isErr()) {
        return result
      }

      context.logger.info(`Successfully generated '${config.projectName}' 🎉`)
      return ok(undefined)
    } catch (error) {
      return err(
        createGeneratorError(ERROR_CODES.GENERATE_COMMAND_ERROR, 'Generate command failed', {
          operation: 'generateCommand',
          cause: error instanceof Error ? error : undefined,
          context: { details: error instanceof Error ? error.message : String(error) },
        })
      )
    }
  },
})

/**
 * Create Trailhead CLI Generator
 *
 * A CLI generator that creates new projects using the @esteban-url/* architecture
 * Built with functional programming principles and explicit error handling
 */
async function main() {
  const cli = createCLI({
    name: 'create-trailhead-cli',
    version: '0.1.0',
    description: 'Modern CLI generator with interactive setup and configuration management',
    commands: [generateCommand, configCommand],
  })

  await cli.run()
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
