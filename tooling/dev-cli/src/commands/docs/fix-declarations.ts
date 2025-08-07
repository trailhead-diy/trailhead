import { createCommand, type CommandOptions } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { colorize, withIcon } from '../../utils/colors.js'
import { docsOperations } from '../../utils/docs.js'

interface FixDeclarationsOptions extends CommandOptions {
  readonly pattern?: string
  readonly dryRun?: boolean
}

export const fixDeclarationsCommand = createCommand<FixDeclarationsOptions>({
  name: 'fix-declarations',
  description: 'Fix function declarations in TypeScript files for consistency',
  options: [
    {
      flags: '--pattern <glob>',
      description: 'Glob pattern for files to process',
      type: 'string',
      default: 'src/**/*.{ts,tsx}',
    },
    {
      flags: '--dry-run',
      description: 'Show what would be fixed without making changes',
      type: 'boolean',
      default: false,
    },
  ],
  examples: [
    'fix-declarations',
    'fix-declarations --pattern "packages/*/src/**/*.ts"',
    'fix-declarations --dry-run',
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('docs', 'Fixing function declarations...')))

    if (options.dryRun) {
      context.logger.info(colorize('yellow', 'Running in dry-run mode - no changes will be made'))
    }

    try {
      context.logger.info(`Searching for files matching: ${options.pattern}`)

      const result = docsOperations.fixFunctionDeclarations(options.pattern)

      if (result.isErr()) {
        return err(result.error)
      }

      const { fixed, errors } = result.value

      if (fixed === 0) {
        context.logger.info(colorize('green', '✅ No function declarations needed fixing'))
      } else {
        context.logger.info(colorize('green', `✅ Fixed function declarations in ${fixed} files`))
      }

      if (errors.length > 0) {
        context.logger.info(colorize('yellow', `⚠️  Encountered ${errors.length} errors:`))
        for (const error of errors) {
          context.logger.info(`   ${error}`)
        }
      }

      return ok(undefined)
    } catch {
      return err(
        createCoreError(
          'DECLARATIONS_FIX_ERROR',
          'DOCS_ERROR',
          'Failed to fix function declarations'
        )
      )
    }
  },
})
