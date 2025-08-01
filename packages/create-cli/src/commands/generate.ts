import { createCommand, type CommandOptions, type CommandContext } from '@esteban-url/cli/command'
import { createDefaultLogger } from '@esteban-url/cli/utils'
import { ok, err, type Result, type CoreError } from '@esteban-url/core'
import { generateProject } from '../lib/core/generator.js'
import { gatherProjectConfig } from '../lib/cli/prompts.js'
import { createGeneratorError, ERROR_CODES, ERROR_SUGGESTIONS } from '../lib/core/errors.js'

/**
 * Generate command options
 */
interface GenerateOptions extends CommandOptions {
  /** Package manager preference */
  readonly packageManager?: string
  /** Include documentation features */
  readonly docs?: boolean
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
export const generateCommand = createCommand<GenerateOptions>({
  name: 'generate',
  description: 'Generate a new CLI project using the @esteban-url/* architecture',
  arguments: '[project-name]',
  options: [
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
    {
      flags: '--dry-run',
      description: 'Show what would be generated without creating files',
      type: 'boolean',
    },
  ],
  examples: [
    'generate my-cli',
    'generate my-cli --non-interactive',
    'generate my-cli --docs --package-manager npm',
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
        packageManager: (options.packageManager || 'pnpm') as 'npm' | 'pnpm',
        docs: options.docs,
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

      context.logger.info(`Generating CLI project: ${config.projectName}`)

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
