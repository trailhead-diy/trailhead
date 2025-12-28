/**
 * Generate command for creating new CLI projects.
 *
 * @module commands/generate
 */

import { createCommand, type CommandOptions, type CommandContext } from '@trailhead/cli/command'
import { createDefaultLogger } from '@trailhead/cli/utils'
import { ok, err, type Result, type CoreError } from '@trailhead/core'
import { generateProject } from '../lib/core/generator.js'
import { createGeneratorError, ERROR_CODES } from '../lib/core/errors.js'
import { resolve } from 'path'
import type { ProjectConfig } from '../lib/config/types.js'

/** Options specific to the generate command */
interface GenerateOptions extends CommandOptions {
  /** Overwrite existing directory */
  readonly force?: boolean
  /** Show what would be generated without creating files */
  readonly dryRun?: boolean
}

/**
 * CLI command that generates new @trailhead/* based projects.
 *
 * Validates project name, creates configuration, and delegates to generateProject.
 */
export const generateCommand = createCommand<GenerateOptions>({
  name: 'generate',
  description: 'Generate a new CLI project using the @trailhead/* architecture',
  arguments: '[project-name]',
  options: [
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
  examples: ['generate my-cli', 'generate my-cli --force', 'generate my-cli --dry-run'],
  action: async (
    options: GenerateOptions,
    context: CommandContext
  ): Promise<Result<void, CoreError>> => {
    try {
      const logger = createDefaultLogger(options.verbose)
      const projectName = context.args[0]

      if (!projectName) {
        return err(
          createGeneratorError(
            ERROR_CODES.PROJECT_NAME_REQUIRED,
            'Project name is required. Usage: create-cli <project-name>',
            {
              operation: 'generateCommand',
            }
          )
        )
      }

      // Validate project name
      if (!/^[a-z0-9-]+$/.test(projectName)) {
        return err(
          createGeneratorError(
            ERROR_CODES.INVALID_PROJECT_NAME,
            'Project name must be lowercase alphanumeric with hyphens only',
            {
              operation: 'generateCommand',
            }
          )
        )
      }

      // Create simple config
      const config: ProjectConfig = {
        projectName,
        projectPath: resolve(projectName),
        packageManager: 'pnpm', // Always use pnpm
        features: {
          core: true,
          config: true, // Always include config
          testing: true, // Always include testing
          validation: false,
          cicd: false,
        },
        projectType: 'standalone-cli',
        nodeVersion: '18',
        typescript: true,
        ide: 'vscode',
        dryRun: options.dryRun || false,
        force: options.force || false,
        verbose: options.verbose || false,
      }

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
      context.logger.info(`\nNext steps:`)
      context.logger.info(`  cd ${config.projectName}`)
      context.logger.info(`  pnpm install`)
      context.logger.info(`  pnpm dev`)

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
