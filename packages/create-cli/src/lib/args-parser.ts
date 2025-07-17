import { ok, err } from '@esteban-url/core'
import type { Result, CoreError } from '@esteban-url/core'
import type { ProjectConfig } from './types.js'
import { createArgsParserError, ERROR_CODES, ERROR_SUGGESTIONS } from './error-helpers.js'

export interface ParsedArgs extends ProjectConfig {
  help: boolean
  version: boolean
}

/**
 * Parse command line arguments into configuration
 */
export function parseArguments(args: string[]): Result<ParsedArgs, CoreError> {
  try {
    const config: ParsedArgs = {
      projectName: '',
      projectPath: '',
      template: 'basic',
      packageManager: 'pnpm',
      includeDocs: false,
      initGit: true,
      installDependencies: true,
      force: false,
      dryRun: false,
      verbose: false,
      help: false,
      version: false,
    }

    let i = 0

    // Parse project name (first positional argument)
    if (args.length > 0 && !args[0].startsWith('-')) {
      config.projectName = args[0]
      config.projectPath = config.projectName // Will be resolved later
      i = 1
    }

    // Parse options
    while (i < args.length) {
      const arg = args[i]

      switch (arg) {
        case '-h':
        case '--help':
          config.help = true
          break

        case '-v':
        case '--version':
          config.version = true
          break

        case '-t':
        case '--template':
          if (i + 1 >= args.length) {
            return err(
              createArgsParserError(
                ERROR_CODES.MISSING_TEMPLATE_VALUE,
                '--template requires a value',
                {
                  suggestion: ERROR_SUGGESTIONS.TEMPLATE_OPTIONS,
                }
              )
            )
          }
          const template = args[i + 1]
          if (template !== 'basic' && template !== 'advanced') {
            return err(
              createArgsParserError(
                ERROR_CODES.INVALID_TEMPLATE_VALUE,
                'Template must be "basic" or "advanced"',
                {
                  suggestion: ERROR_SUGGESTIONS.TEMPLATE_OPTIONS,
                }
              )
            )
          }
          config.template = template
          i++ // Skip the value
          break

        case '-p':
        case '--package-manager':
          if (i + 1 >= args.length) {
            return err(
              createArgsParserError(
                ERROR_CODES.MISSING_PACKAGE_MANAGER_VALUE,
                '--package-manager requires a value',
                {
                  suggestion: ERROR_SUGGESTIONS.PACKAGE_MANAGER_OPTIONS,
                }
              )
            )
          }
          const pm = args[i + 1]
          if (pm !== 'npm' && pm !== 'pnpm') {
            return err(
              createArgsParserError(
                ERROR_CODES.INVALID_PACKAGE_MANAGER_VALUE,
                'Package manager must be "npm" or "pnpm"',
                {
                  suggestion: ERROR_SUGGESTIONS.PACKAGE_MANAGER_OPTIONS,
                }
              )
            )
          }
          config.packageManager = pm
          i++ // Skip the value
          break

        case '--docs':
          config.includeDocs = true
          break

        case '--no-git':
          config.initGit = false
          break

        case '--no-install':
          config.installDependencies = false
          break

        case '--force':
          config.force = true
          break

        case '--dry-run':
          config.dryRun = true
          break

        case '--verbose':
          config.verbose = true
          break

        default:
          if (arg.startsWith('-')) {
            return err(
              createArgsParserError(ERROR_CODES.UNKNOWN_OPTION, `Unknown option: ${arg}`, {
                context: { option: arg },
                suggestion: ERROR_SUGGESTIONS.HELP_COMMAND,
              })
            )
          }
          // Additional positional arguments are not supported
          return err(
            createArgsParserError(ERROR_CODES.UNEXPECTED_ARGUMENT, `Unexpected argument: ${arg}`, {
              context: { argument: arg },
              suggestion: ERROR_SUGGESTIONS.PROJECT_NAME_REQUIRED,
            })
          )
      }

      i++
    }

    // Validate required arguments
    if (!config.help && !config.version && !config.projectName) {
      return err(
        createArgsParserError(ERROR_CODES.PROJECT_NAME_REQUIRED, 'Project name is required', {
          suggestion: ERROR_SUGGESTIONS.PROJECT_NAME_REQUIRED,
        })
      )
    }

    return ok(config)
  } catch (error) {
    return err(
      createArgsParserError(
        ERROR_CODES.ARGUMENT_PARSING_ERROR,
        'Failed to parse command line arguments',
        {
          cause: error instanceof Error ? error : undefined,
          recoverable: false,
        }
      )
    )
  }
}
